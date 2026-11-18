# ADR-005: Keep HTTP Transport Separate from Discovery Use Cases

**Status:** Accepted

## Context

The assignment requires three backend operations. Transport concerns such as JSON parsing, payload limits, status codes, and cache headers should not be mixed into domain rules or persistence adapters.

## Decision

Implement Next.js App Router-compatible route wrappers at `/feed`, `/swipe`, and `/matches`. The wrappers delegate to one transport adapter, which invokes the existing application use cases. A warm-process singleton reuses the Prisma-backed application. All responses use a stable JSON envelope and private/no-store headers.

The swipe request is strict: only `profileId` and `direction` are accepted, the body is bounded to 4 KiB, and the actor is resolved server-side using the assignment's one-user assumption. Unexpected infrastructure details are never returned to clients.

## Consequences

- Domain and application modules remain framework-independent.
- The route adapter can be integration-tested without launching a Next.js server.
- The same exports are compatible with Next.js Route Handler conventions.
- The current identity adapter remains a demo-only, single-user assumption, not a production auth mechanism.
- CORS/CSRF and multi-user session controls must be considered if the deployment model later moves to cross-origin or cookie-authenticated clients.
