// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { PrismaClient } from "../../generated/prisma/client.js";
import { createPrismaClient } from "../database/prisma-client.js";

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

const globalForYugoraAuth = globalThis as typeof globalThis & {
  __yugoraPrismaClient?: PrismaClient;
};

/** One Prisma client per warm Node.js process; never create a pool per request. */
export function getSharedPrismaClient(): PrismaClient {
  if (!globalForYugoraAuth.__yugoraPrismaClient) {
    globalForYugoraAuth.__yugoraPrismaClient = createPrismaClient();
  }
  return globalForYugoraAuth.__yugoraPrismaClient;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Resolve the user's identity by asking Neon Auth to validate its HttpOnly
 * session cookie. The caller never supplies an actor ID in a request body.
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  if (!baseUrl) {
    // Explicitly restricted to local development and automated browser tests.
    // Production never falls back to the assignment's shared demo identity.
    if (process.env.NODE_ENV === "development" || process.env.YUGORA_TEST_IDENTITY === "demo") {
      const id = process.env.DEMO_USER_ID?.trim() || "demo-user";
      return { id, email: "demo@yugora.test", name: "YUGORA Guest" };
    }
    return null;
  }

  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  const origin = new URL(request.url).origin;
  const endpoint = `${baseUrl.replace(/\/+$/u, "")}/get-session`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      accept: "application/json",
      cookie,
      origin,
      referer: `${origin}/`,
    },
    cache: "no-store",
    redirect: "manual",
  });

  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) {
    throw new Error("The authentication service could not validate this session.");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!isRecord(payload) || !isRecord(payload.user)) return null;
  const user = payload.user;
  if (typeof user.id !== "string" || user.id.trim().length === 0) return null;

  return {
    id: user.id,
    email: typeof user.email === "string" ? user.email : "",
    name: typeof user.name === "string" ? user.name : "",
  };
}

export async function ensureApplicationUser(
  prisma: PrismaClient,
  user: AuthenticatedUser,
): Promise<void> {
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id },
  });
}
