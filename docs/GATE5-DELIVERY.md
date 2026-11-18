# YUGORA — Gate 5 Browser QA and Release Review

## Latest complete verification

The PostgreSQL hardening branch passed [GitHub Actions run 44393338816](https://github.com/Manjeet2684/Yugora/actions/runs/44393338816) on commit `0ca19a4fc1e801a626b26067e31878c260bfdf3d`.

| Suite | Tests passed |
|---|---:|
| Migration URL and local avatar configuration | 7 |
| Architecture | 14 |
| PostgreSQL persistence | 11 |
| HTTP integration | 9 |
| UI gesture logic | 5 |
| Copyright checks | 2 |
| Chromium browser journeys | 16 |
| **Total** | **64** |

The run also passed PostgreSQL 16 migrations and repeatable seeding, Prisma schema validation, TypeScript checks, Next.js production build and `npm audit --audit-level=high` (0 vulnerabilities reported).

## Browser and API scenarios

Playwright Test drives Chromium against the built Next.js production server. Most UI journeys intercept same-origin APIs for deterministic behavior and failure coverage. The unmocked full-stack journey uses the pre-seeded PostgreSQL database and exercises the real `GET /feed → POST /swipe → GET /matches` flow, reloads the app, verifies the swiped profile is absent, and confirms the mutual match persists.

Coverage includes:
- Discover displays one profile at a time; Home remains deliberately blank.
- Pass, one-sided Like, mutual Like and Matches view.
- A match celebration opens only when the server returns a confirmed Match DTO.
- Keyboard arrow actions and native Chromium touchscreen pointer events.
- Feed exclusion after a decision and after reload.
- Empty feed, broken-image fallback, and independent feed/swipe/matches error recovery.
- Mobile navigation, a 390px responsive viewport without horizontal overflow, reduced-motion behavior, accessible button names, and modal focus/Escape behavior.
- API privacy checks for one-sided incoming LIKES and explicit DTO fields.
- Duplicate requests and concurrent reciprocal LIKEs converge on one canonical Match.

## Additional integration hardening

- Runtime uses pooled `DATABASE_URL`; Prisma CLI prioritizes Neon direct `DATABASE_URL_UNPOOLED`, keeping `DIRECT_URL` as a compatibility fallback.
- Vercel build command runs `prisma migrate deploy`, the idempotent demo seed, then `next build`.
- Vercel Function region is configured to `sin1`, aligned with the selected Neon Singapore region.
- Seeded fictional profiles use self-contained SVG data URLs. Browser requests no longer contact the former third-party avatar host.
- CI includes migration URL precedence and avatar escaping/data-URL regression tests.
- Vercel Firewall has a valid active rate-limit rule for `POST /swipe`: 20 requests per source IP per 60 seconds.

## Hosted verification still outstanding

The Vercel project is linked to this GitHub repository and has SSO protection enabled, but the Vercel API currently reports no deployments, domains or project environment variables. The supplied screenshot is still on Neon’s Connect Project wizard. Therefore we have not yet verified:
- Neon pooled/direct variables are created under the exact unprefixed names;
- Preview gets an isolated Neon branch while Production uses the default branch;
- migrations and seed execute against the managed database;
- persistence survives separate Vercel Function invocations;
- the Firewall rule produces an HTTP 429 at the configured threshold;
- HTTPS/HSTS, Preview access and final deployed response headers.

Manual physical-device iOS/Android and screen-reader tests also remain outstanding. This document is not a production security sign-off.
