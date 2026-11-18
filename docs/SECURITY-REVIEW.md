# YUGORA — Senior Engineering and Security Review

**Review date:** 19 November 2026  
**Assignment:** Coy SDE Intern — Discover tab  
**Repository:** [Manjeet2684/Yugora](https://github.com/Manjeet2684/Yugora)  
**Engineering branch:** `feature/postgres-production-hardening` (PR #8, intentionally still a draft)  
**Reviewed commit:** `0ca19a4fc1e801a626b26067e31878c260bfdf3d`  
**Review scope:** Assignment traceability, source and migration review, application/API design review, GitHub Actions evidence, and read-back of the Vercel project's configuration.

**Limitations:** This is a scoped engineering review, not a certified penetration test, external DAST assessment, load/soak test, or production security approval. There is no deployed YUGORA URL yet, and the Neon connection wizard has not been completed. No live attack traffic was sent to a production service.

## Executive assessment

The core Coy Part B implementation is present: 30 fictional seeded profiles, eight incoming demo likes, Discover swipe interaction, pass/like persistence, mutual-only matches, a Matches view, and the three required API routes. The PostgreSQL hardening branch replaces the original SQLite persistence adapter with Prisma 7 and PostgreSQL migrations, constraints, triggers, and transaction-scoped pair locking.

The latest complete GitHub Actions run for the reviewed code commit is [44398530835](https://github.com/Manjeet2684/Yugora/actions/runs/44398530835), on commit `8791a8a154b024fcf6faa0dc6c8f25b53e82b457`. It passed **69 tests**: 8 configuration/avatar, 15 architecture, 12 PostgreSQL persistence, 11 HTTP, 5 UI gesture, 2 copyright and 16 Chromium browser tests. The run also passed schema validation, TypeScript checks, PostgreSQL 16 migration/seed tests, the exact Vercel migration/seed/build command, production build, and `npm audit --audit-level=high` with 0 reported vulnerabilities.

**Current conclusion:** Part B is substantially implemented and has strong automated evidence. Hosted acceptance is not complete because the Neon-to-Vercel connection and Preview deployment are still pending. Part A's private Coy walkthrough remains unverified. Do not merge PR #8 or expose the shared demo publicly until the remaining release gates below are closed.

## Assignment acceptance matrix

| Client requirement | Evidence in the repository | Assessment |
|---|---|---|
| Standalone Next.js/React app, blank Home and functional Discover | App Router, responsive UI and Chromium journey | Implemented; CI-verified |
| 30+ mock profiles with required fields | Idempotent seed: 30 fictional profiles with name, age, photo, bio, location and interests | Implemented; PostgreSQL seed test |
| Incoming demo likes | Eight directed incoming LIKE rows in the seed | Implemented; privacy tested |
| One card, touch gestures and desktop actions | Pointer/touch gesture logic, Like/Pass controls and match modal | Implemented; Chromium tested |
| No repeat profiles; empty state | Viewer-directed swipe exclusion and dedicated empty/retry states | Implemented; persistence/browser tested |
| Mutual-only matching | Domain policy, repository check, PostgreSQL constraints/triggers and transaction-scoped pair lock | Implemented; PostgreSQL regression tested |
| Matches view; do not reveal one-sided incoming interest | Persisted Match query and explicit public DTO projection | Implemented; HTTP privacy tests |
| `GET /feed`, `POST /swipe`, `GET /matches` | Next.js Route Handlers and HTTP integration tests | Implemented; tested |
| Persistence across reloads | PostgreSQL-backed persistence and full-stack browser journey | CI-tested against PostgreSQL 16; managed Neon verification pending |
| Coy OTP/add-crush/email/invite/extra-slots walkthrough | `docs/PART-A-PRODUCT-RECOMMENDATIONS.md` explicitly records this as not yet personally verified | Outstanding |
| Two core product recommendations | Two preliminary recommendations with privacy guardrails are documented | Draft; validate after actual Coy walkthrough |

The implementation covers the assignment's single assumed demo user and intentionally does not add external authentication. That is within the assignment's stated scope; it is not a real multi-user identity model.

## Correctness and security controls reviewed

- The current user is resolved server-side from `DEMO_USER_ID`; the browser cannot submit an acting-user ID.
- The swipe API requires JSON, streams and caps the body at 4 KiB, validates UTF-8/JSON, allows only `profileId` and `direction`, and rejects unknown fields, invalid directions, self-swipes and malformed IDs.
- Responses use private/no-store cache headers. Unexpected errors do not return SQL, ORM messages, stack traces, filesystem paths or connection values.
- The feed excludes profiles the viewer has already decided on, but does not exclude or label profiles that have only liked the viewer.
- Public profile and match DTOs are explicit allow-lists; internal owner and swipe identifiers are not projected to the browser.
- A match is created only after both directed LIKE decisions exist. The repository checks both persisted rows, database triggers reject an invalid match, swipe decisions are immutable, and a supporting swipe deletion removes the pair's match.
- PostgreSQL pair-level advisory locking addresses simultaneous reciprocal-LIKE requests. Pair canonicalization uses UTF-8 byte ordering to match PostgreSQL bytewise `COLLATE C`, and the lock uses the same canonical pair. Unique constraints and idempotent upserts prevent duplicate directed decisions and duplicate matches.
- Prisma operations use the generated client. The transaction lock uses a parameterized tagged raw query; no user-controlled SQL string is concatenated.
- Seeded avatar assets are self-contained SVG data URLs, rather than requests to a third-party photo host. This avoids sending demo visitors' IP/network metadata to that image provider. The generator and UI initials fallback use Unicode code points, not split UTF-16 surrogate halves; the CSP no longer permits that host.
- Next.js sends CSP, anti-framing, MIME-sniffing, referrer, permissions and cross-origin isolation/resource headers. The CSP still permits `'unsafe-inline'` for Next.js compatibility; it is a baseline, not a strict nonce/hash CSP.

## Infrastructure state verified

### Vercel project

The Vercel project exists and is linked to this GitHub repository. The read-back state was:

| Item | Observed state |
|---|---|
| Project | `yugora` |
| Team plan | Hobby |
| Framework/runtime | Next.js, Node 22.x |
| Git link | `Manjeet2684/Yugora` |
| Deployments | None |
| Domains | None |
| Project environment variables | None returned |
| SSO deployment protection | Enabled for all non-custom-domain deployments |
| Password protection | Disabled |

The project is not live yet. SSO protection is a useful safeguard for the shared demo identity; keep it enabled for Preview while the app has one shared mutable demo account.

### Neon integration wizard

The Neon Marketplace integration is installed on the team Free plan, but its integration configuration currently has `projects: []`. The supplied screenshot shows the Connect Project step, not a completed project connection. The current wizard choices shown were Free plan, Singapore `sin1`, Auth enabled, Realtime disabled, and Vercel environments Production and Preview. The Custom Prefix field showed `STORAGE`; Preview/Production branch checkboxes were not selected in the captured screen.

**Required connection choices:**
- Leave Custom Prefix blank. Vercel prepends a custom prefix to every generated environment variable name; `STORAGE` would produce names such as `STORAGE_DATABASE_URL` and `STORAGE_DATABASE_URL_UNPOOLED`, which the application does not read.
- Enable database branch creation for **Preview only**. Leave Production unchecked so Production uses the default Neon branch and each Preview receives an isolated copy-on-write branch.
- Keep the environment target set to Production and Preview, keep the Sensitive toggle enabled, and click Connect.
- Neon Auth may remain enabled, but YUGORA does not use it for the assignment. Realtime remains unnecessary and can stay disabled.

### Database URL contract and build

The code now uses:
- `DATABASE_URL` (pooled) for application runtime queries.
- `DATABASE_URL_UNPOOLED` (direct) for Prisma CLI migrations/seeding, preferred by `prisma.config.ts`.
- `DIRECT_URL` is retained only as a backwards-compatible fallback.

The Vercel build command runs migrations, the idempotent demo seed, then the Next.js production build. This prevents a deployment from reaching runtime before its schema and demo profiles exist. `vercel.json` sets Function region `sin1` to align with the selected Singapore database region.

### Vercel Firewall

A custom firewall configuration is enabled and read back as active/valid. It contains one rule:

- Match: `GET /feed`, `POST /swipe`, and `GET /matches`
- Key: source IP
- Algorithm: fixed window
- Threshold: 60 requests per IP per 60 seconds across the matched API rule
- Mitigation: rate limit

The rule is valid and active in Vercel and protects all three assignment API routes. Its actual HTTP 429 behavior cannot be tested until a deployment exists.

## Findings and release risks

### High — shared demo identity (assignment-compliant, not public multi-user safe)

All visitors to an unprotected deployment would share the same `DEMO_USER_ID` and therefore the same feed/swipe history. Visitors could consume the demo feed or alter demo matches for everyone. This matches the assignment's no-external-auth assumption, so adding auth is not necessary to satisfy Part B.

**Required:** keep Vercel SSO/Deployment Protection enabled on Preview and do not publish an unprotected public interactive URL. A real multi-user launch requires authentication, per-user authorization and ownership checks.

### High — Neon connection and hosted persistence remain unverified

The project API currently reports no deployment and no project environment variables, and the screenshot is still on Connect Project. PostgreSQL CI proves the migrations work against PostgreSQL 16, not that the managed Neon resource is connected or that Vercel Functions persist across separate instances.

**Required:** finish the Neon connection, verify generated variable names/targets without exposing their values, allow Preview branching, deploy a protected Preview, then verify migrations, seed, API behavior and persistence across multiple invocations.

### Medium — CSP allows inline scripts/styles

The current policy contains `'unsafe-inline'` for Next.js runtime compatibility. This is not equivalent to a strict nonce/hash CSP. Tighten only with a framework-compatible nonce implementation and browser regression tests.

### Medium — HTTPS/HSTS not yet verified

No HTTPS deployment exists yet. HSTS is intentionally not asserted or configured until the actual deployment's HTTPS redirect and response headers are verified.

### Low — feed and Matches query scaling

The feed returns the assignment's small fixture set and does not paginate. The Matches use case resolves counterpart profiles separately, which creates an N+1 query pattern at larger match counts. This is acceptable for the assignment's 30-profile demo; add pagination and a joined projection before scaling.

### Low — workflow action supply-chain hardening

The workflow now uses Node 24-compatible major releases for checkout and setup-node. Major-version tags are still mutable references; pin verified action commit SHAs if the repository adopts a stricter supply-chain policy.

## Attack and manual test record

**Completed through source review and automated CI:**
- malformed JSON, wrong media type, oversized body, invalid direction, unknown fields and client actor-ID override attempts;
- self-swipe and unknown-profile rejection;
- duplicate requests, opposite-direction decisions and concurrent reciprocal likes;
- non-mutual incoming-like privacy, mutual match DTO shape and no-repeat feed behavior;
- match trigger/invariant regressions, immutable swipe decisions and transaction rollback;
- mobile pointer/touch gesture, reload flow, empty/error recovery, reduced motion and basic accessibility-oriented browser checks;
- dependency audit and PostgreSQL 16 migrations.

**Not performed because there is no deployed target or private Coy test session:**
- live attack traffic, deployed endpoint rate-limit/429 verification, Vercel cross-instance/cold-start persistence, external DAST/ZAP/Burp, load/soak testing;
- physical iOS/Android testing and manual screen-reader evaluation;
- the private Coy OTP, add-crush, email verification, invitation and extra-slots walkthrough.

Do not describe these outstanding checks as completed. The current review does not establish that YUGORA is vulnerability-free.

## Release decision

**Part B code:** substantially complete; the latest reviewed PostgreSQL code commit has 69 passing automated checks.  
**Hosted Preview:** blocked on completing the Neon Connect Project step and verifying the deployed environment.  
**Public production:** not approved while the application uses a shared unauthenticated demo identity.  
**Part A:** still requires the actual private Coy walkthrough and applicant validation of the two drafted recommendations.

Keep PR #8 as a draft until the hosted Preview acceptance checks pass. Do not merge or expose the app publicly merely because PostgreSQL CI is green.
