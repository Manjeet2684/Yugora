# YUGORA — Security and Release Review

**Assignment:** Coy SDE Intern — Discover tab  
**Repository:** [Manjeet2684/Yugora](https://github.com/Manjeet2684/Yugora)  
**Candidate:** `feature/postgres-production-hardening` (PR #8, draft)  
**Review date:** 19 November 2026

## Assessment

The assignment's Part B application is implemented on the candidate branch: 30 fictional profiles, eight incoming demo likes, Discover, persistent swipe decisions, mutual-only matching, Matches and the three required APIs. The application uses Next.js, TypeScript, Prisma 7 and PostgreSQL.

The core privacy rule is enforced in the domain, repositories and database. A match requires reciprocal LIKE records. The feed excludes viewer-authored decisions but does not expose incoming one-sided interest. Swipe requests are bounded and validated; the server resolves the acting demo identity; responses are private/no-store and unexpected server errors are redacted.

## Controls in place

- Unique actor/target Swipe decisions and canonical Match pairs.
- PostgreSQL checks and triggers for valid matches, immutable swipe decisions and stale-match cleanup.
- Transaction-scoped advisory locks for simultaneous reciprocal likes.
- Strict 4 KiB JSON request parsing, UTF-8 validation, field allow-list and rejection of client-supplied actor IDs.
- Explicit public DTO projection and no incoming-interest flags/counts.
- Self-contained local SVG avatar placeholders.
- Vercel SSO protection for non-custom-domain deployments.
- Active Vercel Firewall rule for `GET /feed`, `POST /swipe` and `GET /matches`: 60 requests per source IP per 60 seconds.

## Protected Preview — verified 19 November 2026

The current candidate commit `7c8da3e633f274d1dcae03bff7fbdb9f9279532c` is deployed to the [protected YUGORA Preview](https://yugora-git-feature-postgres-production-hardening-manjeet12.vercel.app/).

- The Vercel project remains SSO-protected; `live` remains false and no Production environment variables are configured.
- A dedicated Neon child branch named `yugora-preview` was created from the Marketplace-created project's default branch in Singapore (`aws-ap-southeast-1`). The parent default branch was not modified by YUGORA migrations or seed.
- Neon connection variables are scoped to Preview and the feature branch only: sensitive pooled `DATABASE_URL`, sensitive direct `DATABASE_URL_UNPOOLED`, and `DEMO_USER_ID`. No Production variables are present.
- The Neon read-write endpoint has transaction pooling enabled. Both connection URLs use explicit `sslmode=verify-full`.
- Both PostgreSQL migrations applied successfully. The idempotent seed produced 30 Profile rows, 31 User rows (including the demo identity), eight incoming Swipe LIKE rows and zero Match rows.
- Protected Preview smoke checks returned 200 from `GET /`, `GET /feed` with 30 public profiles, and `GET /matches` with zero matches. Matches responses have private/no-store cache headers; deployed responses include HSTS and baseline security headers.
- The fresh Preview build completed successfully. The latest runtime-log query returned no entries.

The Neon Marketplace installation is present, and the PostgreSQL project was created from the Vercel Marketplace path. Vercel's integration-configuration read-back did not expose a connector-managed project association; the working database connection was completed with branch-scoped Vercel environment variables. Do not describe the connector configuration object itself as project-connected.

## Known release limitations

### Shared demo identity

The assignment permits one assumed logged-in user and no external authentication. YUGORA uses a server-configured `DEMO_USER_ID`, so visitors to an unprotected deployment would share one mutable swipe history and match list.

Keep Preview protected by Vercel SSO. This is assignment-compliant but is not a production multi-user identity system.

### Hosted behavior still to verify

The hosted smoke test exercised page load, `GET /feed` and `GET /matches`. The hosted `POST /swipe` and cross-invocation persistence path have not yet been directly exercised against this Preview. The PostgreSQL/HTTP integration tests and Chromium browser suite cover these flows in CI.

The Firewall rate-limit configuration is active and valid (60 requests per IP per 60 seconds), but an actual edge HTTP 429 response has not been verified. Do not state that live rate-limit behavior is tested.

### Browser and platform security

The current CSP permits `'unsafe-inline'` for Next.js compatibility; it is a baseline, not a strict nonce/hash CSP. HSTS and baseline response headers were observed on the protected Preview. No external DAST, load/soak testing, physical iOS/Android testing or manual screen-reader review has been performed.

### Part A

The private Coy OTP, add-crush, email verification, invite and extra-slots walkthrough remains outstanding. The recommendations in `docs/PART-A-PRODUCT-RECOMMENDATIONS.md` are explicitly preliminary.

## Release decision

Part B has a successful protected Preview deployment and Neon-backed GET smoke checks. Hosted swipe acceptance, live rate-limit verification and Part A remain open. Do not merge PR #8 or expose an unrestricted public interactive demo until the remaining release gates are closed.
