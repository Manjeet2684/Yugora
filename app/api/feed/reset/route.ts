// Copyright (c) 2026 Manjeet2684. All rights reserved.
import { ensureApplicationUser, getAuthenticatedUser, getSharedPrismaClient } from "../../../../src/infrastructure/auth/neon-auth-context.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

function sameOrigin(request: Request): boolean {
  const expected = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).origin !== expected) return false; } catch { return false; }
  }
  return request.headers.get("sec-fetch-site") !== "cross-site";
}

/** Start a fresh 30-profile round by deleting Pass decisions only. Likes and Matches remain untouched. */
export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ message: "This request came from an untrusted origin." }, 403);
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return json({ message: "Sign in to start another round." }, 401);
    const prisma = getSharedPrismaClient();
    await ensureApplicationUser(prisma, user);
    const result = await prisma.swipe.deleteMany({
      where: { actorUserId: user.id, direction: "PASS" },
    });
    return json({ resetCount: result.count });
  } catch {
    return json({ message: "A new discovery round could not be started." }, 503);
  }
}
