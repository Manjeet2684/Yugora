// Copyright (c) 2026 Manjeet2684. All rights reserved.
// First-party proxy: keeps the Neon Auth session cookie on the YUGORA origin.
import { isPublicDemoMode } from "../../../../src/infrastructure/auth/demo-mode.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ path: string[] }> };
const ALLOWED_PATHS = new Set([
  "get-session",
  "sign-out",
  "email-otp/send-verification-otp",
  "sign-in/email-otp",
]);

function localDemoEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.YUGORA_TEST_IDENTITY === "demo";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store" } });
}

function isSameOrigin(request: Request): boolean {
  const requestUrl = new URL(request.url);
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || requestUrl.protocol.replace(/:$/u, "");
  const host = request.headers.get("host");
  const acceptedOrigins = new Set([requestUrl.origin]);
  if (host) acceptedOrigins.add(`${protocol}://${host}`);

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (!acceptedOrigins.has(new URL(origin).origin)) return false;
    } catch { return false; }
  }
  return request.headers.get("sec-fetch-site") !== "cross-site";
}

async function proxy(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const routePath = path.join("/");
  if (!ALLOWED_PATHS.has(routePath)) return json({ message: "Authentication route not found." }, 404);

  if (request.method !== "GET" && !isSameOrigin(request)) {
    return json({ message: "This authentication request came from an untrusted origin." }, 403);
  }

  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  if (!baseUrl) {
    if (routePath === "get-session" && localDemoEnabled()) {
      const id = process.env.DEMO_USER_ID?.trim() || "demo-user";
      return json({ session: { id: "local-demo-session" }, user: { id, email: "demo@yugora.test", name: "YUGORA Guest" } });
    }
    if (routePath === "sign-out" && localDemoEnabled()) return json({ success: true });
    return json({ message: "Email sign-in is not configured for this deployment." }, 503);
  }

  const incomingUrl = new URL(request.url);
  const destination = `${baseUrl.replace(/\/+$/u, "")}/${routePath}${incomingUrl.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");
  headers.delete("x-forwarded-port");
  headers.delete("forwarded");
  headers.set("accept", "application/json");
  headers.set("origin", incomingUrl.origin);
  headers.set("referer", `${incomingUrl.origin}/`);

  const init: RequestInit = { method: request.method, headers, cache: "no-store", redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength > 8_192) return json({ message: "The authentication request is too large." }, 413);
    init.body = body;
  }

  let upstream: Response;
  try {
    upstream = await fetch(destination, init);
  } catch {
    return json({ message: "The email sign-in service is temporarily unavailable." }, 502);
  }

  const responseHeaders = new Headers({
    "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) responseHeaders.set("retry-after", retryAfter);

  const getSetCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = getSetCookie ? getSetCookie.call(upstream.headers) : [];
  for (const cookie of cookies) {
    responseHeaders.append("set-cookie", cookie.replace(/;\s*domain=[^;]+/giu, ""));
  }

  const responseBody = await upstream.arrayBuffer();
  if (routePath === "get-session" && isPublicDemoMode()) {
    let payload: unknown = null;
    try { payload = JSON.parse(new TextDecoder().decode(responseBody)); } catch { /* Treat an empty/invalid session response as signed out. */ }
    const user = isRecord(payload) && isRecord(payload.user) ? payload.user : null;
    if (upstream.status === 401 || upstream.status === 403 || !user || typeof user.id !== "string") {
      return json({ user: null, demoMode: true });
    }
  }

  return new Response(responseBody, { status: upstream.status, headers: responseHeaders });
}

export function GET(request: Request, context: RouteContext): Promise<Response> {
  return proxy(request, context);
}
export function POST(request: Request, context: RouteContext): Promise<Response> {
  return proxy(request, context);
}
