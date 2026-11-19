// Copyright (c) 2026 Manjeet2684. All rights reserved.
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createPlaceholderProfilePhotoUrl } from "../../../src/shared/profile-placeholder-photo.js";
import { ensureApplicationUser, getAuthenticatedUser, getSharedPrismaClient } from "../../../src/infrastructure/auth/neon-auth-context.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HEADERS = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const INCLUDE_INTERESTS = { interests: { include: { interest: true }, orderBy: { position: "asc" as const } } };

function json(body: unknown, status = 200): Response {
  return NextResponse.json(body, { status, headers: HEADERS });
}

function sameOrigin(request: Request): boolean {
  const expected = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).origin !== expected) return false; } catch { return false; }
  }
  return request.headers.get("sec-fetch-site") !== "cross-site";
}

async function identity(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return null;
  const prisma = getSharedPrismaClient();
  await ensureApplicationUser(prisma, user);
  return { user, prisma };
}

function mapProfile(row: {
  id: string; name: string; age: number; photoUrl: string; bio: string; locationLabel: string;
  interests: Array<{ interest: { name: string } }>;
}, email: string) {
  return {
    id: row.id, name: row.name, age: row.age, photoUrl: row.photoUrl,
    bio: row.bio, locationLabel: row.locationLabel, email,
    interests: row.interests.map((entry) => entry.interest.name),
  };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const context = await identity(request);
    if (!context) return json({ message: "Sign in to view your profile." }, 401);
    const row = await context.prisma.profile.findUnique({
      where: { ownerUserId: context.user.id },
      include: INCLUDE_INTERESTS,
    });
    if (row) return json({ profile: mapProfile(row, context.user.email) });

    // Local/CI fixture only. Real Preview accounts must complete profile setup.
    if (context.user.email === "demo@yugora.test" && process.env.YUGORA_TEST_IDENTITY === "demo") {
      const name = "YUGORA Guest";
      return json({ profile: {
        id: "local-demo-profile",
        name,
        age: 25,
        photoUrl: createPlaceholderProfilePhotoUrl(name, 3),
        bio: "Here for genuine conversations and good coffee.",
        locationLabel: "New Delhi",
        email: context.user.email,
        interests: ["Coffee", "Reading", "Music"],
      } });
    }
    return json({ profile: null });
  } catch {
    return json({ message: "Your profile could not be loaded. Please try again." }, 503);
  }
}

export async function PUT(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ message: "This profile update came from an untrusted origin." }, 403);
  try {
    const context = await identity(request);
    if (!context) return json({ message: "Sign in before updating your profile." }, 401);

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > 8_192) return json({ message: "The profile update is too large." }, 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 8_192) return json({ message: "The profile update is too large." }, 413);

    let value: unknown;
    try { value = JSON.parse(raw); } catch { return json({ message: "Send a valid JSON profile." }, 400); }
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return json({ message: "The profile must be a JSON object." }, 400);
    }

    const body = value as Record<string, unknown>;
    const allowed = new Set(["name", "age", "bio", "locationLabel", "interests"]);
    if (Object.keys(body).some((key) => !allowed.has(key))) return json({ message: "The profile contains an unsupported field." }, 400);

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    const locationLabel = typeof body.locationLabel === "string" ? body.locationLabel.trim() : "";
    const age = typeof body.age === "number" ? body.age : Number.NaN;
    if (!name || name.length > 70) return json({ message: "Enter a name between 1 and 70 characters." }, 400);
    if (!Number.isInteger(age) || age < 18 || age > 100) return json({ message: "YUGORA profiles are for adults aged 18 to 100." }, 400);
    if (bio.length > 420) return json({ message: "Keep your introduction under 420 characters." }, 400);
    if (!locationLabel || locationLabel.length > 80) return json({ message: "Enter a city or location under 80 characters." }, 400);
    if (!Array.isArray(body.interests)) return json({ message: "Choose or add at least one hobby." }, 400);

    const interests = [...new Map(
      body.interests
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().replace(/\s+/gu, " "))
        .filter((item) => item.length > 0 && item.length <= 32)
        .map((item) => [item.toLocaleLowerCase("en-US"), item] as const),
    ).values()];
    if (interests.length < 1 || interests.length > 10) {
      return json({ message: "Choose between 1 and 10 hobbies." }, 400);
    }

    const profile = await context.prisma.$transaction(async (tx) => {
      const saved = await tx.profile.upsert({
        where: { ownerUserId: context.user.id },
        update: {
          name, age, bio, locationLabel,
          photoUrl: createPlaceholderProfilePhotoUrl(name, 3),
          isActive: true,
        },
        create: {
          id: randomUUID(), ownerUserId: context.user.id, name, age,
          photoUrl: createPlaceholderProfilePhotoUrl(name, 3), bio, locationLabel,
          isActive: true, displayOrder: 0,
        },
      });
      await tx.profileInterest.deleteMany({ where: { profileId: saved.id } });
      const linked = [];
      for (const [position, interestName] of interests.entries()) {
        const interest = await tx.interest.upsert({
          where: { name: interestName },
          update: {},
          create: { name: interestName },
        });
        linked.push({ profileId: saved.id, interestId: interest.id, position });
      }
      await tx.profileInterest.createMany({ data: linked });
      return tx.profile.findUnique({ where: { id: saved.id }, include: INCLUDE_INTERESTS });
    });

    if (!profile) return json({ message: "Your profile could not be saved." }, 500);
    return json({ profile: mapProfile(profile, context.user.email) });
  } catch {
    return json({ message: "Your profile could not be saved. Please try again." }, 503);
  }
}
