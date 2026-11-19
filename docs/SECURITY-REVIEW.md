# YUGORA — Security and Release Review

**Assignment:** Coy SDE Intern — Discover tab  
**Repository:** [Manjeet2684/Yugora](https://github.com/Manjeet2684/Yugora)  
**Candidate:** `feature/postgres-production-hardening` (PR #8, draft)  
**Review date:** 19 November 2026

## Assessment

The assignment's Part B application is implemented on the candidate branch: 30 fictional profiles, eight incoming demo likes, Discover, persistent swipe decisions, mutual-only matching, Matches and the three required APIs. The application uses Next.js, TypeScript, Prisma 7 and PostgreSQL.

The core privacy rule is enforced in the domain, repositories and database. A match requires reciprocal LIKE records. The feed excludes viewer-authored decisions but does not expose incoming one-sided interest. The protected assignment Preview provides a one-click guest entry using the single server-resolved demo identity; in that mode, the feed is restricted to the 30 fictional seeded profiles so member-owned profiles are not mixed into the assignment catalogue. Swipe requests are bounded and validated; the server resolves the acting demo identity; responses are private/no-store and unexpected server errors are redacted.

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

The current deployment commit `414338ce4639b0fe440aa602f37a0be062713b5f` is deployed and Ready on the [protected YUGORA Preview](https://yugora-git-feature-postgres-production-hardening-manjeet12.vercel.app/).

- The Vercel project remains SSO-protected; `live` remains false and no Production environment variables are configured.
- `YUGORA_PUBLIC_DEMO_MODE=true` is a plain, branch-scoped Preview variable for `feature/postgres-production-hardening`. The application guard enables it only outside Production or on a Vercel Preview runtime; Production runtimes ignore the flag. The assignment entry is intentionally a shared single-user demo, not a production identity model.
- A dedicated Neon child branch named `yugora-demo-ready` was created from the Marketplace-created project's default branch in Singapore (`aws-ap-southeast-1`). The parent default branch was not modified by YUGORA migrations or seed.
- Neon connection variables are scoped to Preview and the feature branch only: sensitive pooled `DATABASE_URL`, sensitive direct `DATABASE_URL_UNPOOLED`, and `DEMO_USER_ID`. No Production variables are present.
- The Neon read-write endpoint has transaction pooling enabled. Both connection URLs use explicit `sslmode=verify-full`.
- Both PostgreSQL migrations applied successfully. The idempotent seed produced 30 Profile rows, 31 User rows (including the demo identity), eight incoming Swipe LIKE rows, zero demo-user decisions and zero Match rows. The earlier `yugora-preview` branch retains its separate 30 swipe decisions and three mutual matches; it was not reset or deleted.
- Protected Preview smoke checks returned 200 from `GET /`, `GET /feed` with 30 public profiles, and `GET /matches` with zero matches. Matches responses have private/no-store cache headers; deployed responses include HSTS and baseline security headers.
- The final Preview build completed successfully from commit `414338ce4639b0fe440aa602f37a0be062713b5f`. Hosted smoke checks returned HTTP 200 from `/`, `/api/profile`, `/feed` and `/matches`. The public feed returned exactly 30 seeded profile IDs, with no member-owned profiles; the guest profile loaded and Matches returned zero rows.
- A read-only Neon count confirmed 30 seeded profiles, 120 seeded interest links, eight incoming demo LIKE rows, zero decisions by the shared demo identity and zero demo matches. The database retains a separate member-owned profile, but the assignment demo query does not expose it.
- The latest GitHub quality-gate run [44579387456](https://github.com/Manjeet2684/Yugora/actions/runs/44579387456) passed. This includes 20 Chromium journeys, the one-click reviewer entry, demo-mode production guards, the PostgreSQL demo-feed isolation regression, and `npm audit --audit-level=high` with zero vulnerabilities.

The Neon Marketplace installation is present, and the PostgreSQL project was created from the Vercel Marketplace path. Vercel's integration-configuration read-back did not expose a connector-managed project association; the working database connection was completed with branch-scoped Vercel environment variables. Do not describe the connector configuration object itself as project-connected.

## Known release limitations

### Shared demo identity

The assignment permits one assumed logged-in user and no external authentication. YUGORA uses a server-configured `DEMO_USER_ID`, so visitors to an unprotected deployment would share one mutable swipe history and match list.

Keep Preview protected by Vercel SSO. This is assignment-compliant but is not a production multi-user identity system.

### Hosted behavior — completed and outstanding

The protected Preview was tested against the hosted `POST /swipe` handler using idempotent LIKE/PASS retries, an opposite-decision conflict, unknown profile, rejected client actor override, unsupported content type, malformed JSON and an oversized body. Expected responses (200, 409, 404, 400, 415 and 413) were observed. These were non-mutating retries or rejected requests.

The active Firewall rule was exercised from a single test source: 60 `GET /feed` requests returned 200 and request 61 returned 429, matching the 60-per-60-second configuration.

A fresh reciprocal-match creation and its persistence across separate Vercel Function invocations remain to be tested on a dedicated QA identity. The clean demo branch was deliberately left with all 30 profiles available and no test decisions.

### Browser and platform security

The current CSP permits `'unsafe-inline'` for Next.js compatibility; it is a baseline, not a strict nonce/hash CSP. HSTS and baseline response headers were observed on the protected Preview. No external DAST, load/soak testing, physical iOS/Android testing or manual screen-reader review has been performed.

### Part A

The private Coy OTP, add-crush, email verification, invite and extra-slots walkthrough remains outstanding. The recommendations in `docs/PART-A-PRODUCT-RECOMMENDATIONS.md` are explicitly preliminary.

## Release decision

Part B has a successful protected Preview deployment, Neon-backed GET smoke checks, hosted swipe validation/error-handling checks, and a verified edge HTTP 429 threshold. Brand-new reciprocal-match creation/persistence, physical device and assistive-technology checks, and Part A remain open. Do not merge PR #8 or expose an unrestricted public interactive demo until the remaining release gates are closed.
