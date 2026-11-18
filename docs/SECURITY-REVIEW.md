# YUGORA — Senior Engineering and Security Review

**Review date:** 18 November 2026  
**Assignment baseline:** `main` commit `05925b1ee58770c82b936b1aeabfbca4e750150e`  
**Production-hardening branch:** `feature/postgres-production-hardening`  
**Review type:** Static code review, requirements traceability, automated integration/browser tests on the baseline, and targeted concurrency/security cases added to the PostgreSQL branch.  
**Not claimed:** This is not a certified penetration test, external DAST engagement, load/soak test, legal opinion, or production security sign-off.

## Executive assessment

The assignment's Part B implementation passed its original CI baseline: 14 architecture tests, 10 persistence tests, 9 HTTP tests, 5 UI gesture tests, 2 copyright tests, and 16 Chromium browser tests (56 tests total), with a successful production build and a zero-vulnerability result from `npm audit --audit-level=high` at that point in time.

The production-hardening branch changes the Prisma provider and driver to PostgreSQL, replaces SQLite-specific schema/migrations with PostgreSQL DDL and PL/pgSQL triggers, makes a PostgreSQL URL mandatory at runtime, and adds a PostgreSQL transaction-scoped advisory lock plus a simultaneous reciprocal-LIKE regression test. **Those new changes have not yet passed GitHub Actions**; the result must be verified before merging or creating a deployable project. A managed database has not yet been provisioned or connected.

No critical exploit was confirmed in the scoped baseline code review. That is not a claim that the project is vulnerability-free.

## Assignment acceptance matrix

| Client requirement | Evidence | Assessment |
|---|---|---|
| Standalone React/Next.js app | Next.js App Router and React UI | Pass on assignment baseline |
| Blank Home tab and functional Discover tab | Browser test verifies Home has no content and Discover works | Pass on assignment baseline |
| At least 30 mock profiles with required fields | Deterministic seed creates 30 fictional profiles with age, photo, bio, city and interests | Pass on assignment baseline |
| Some profiles already liked the demo user | Seed creates eight directed incoming LIKE rows | Pass on assignment baseline |
| One profile card at a time; desktop and touch actions | Chromium browser and gesture tests | Pass on assignment baseline |
| Empty state and error recovery | UI and browser tests | Pass on assignment baseline |
| Mutual-only Match; incoming interest remains private | Use case, repository guard, database trigger design, HTTP tests and browser tests | Pass on assignment baseline; PostgreSQL trigger port awaits CI |
| Required API routes and persistent swipe/match state | Route handlers and database-backed browser reload journey | Pass on assignment baseline |
| PostgreSQL deployment persistence | PostgreSQL adapter, migrations and CI service added on hardening branch | Awaiting CI and managed-database verification |
| Coy Part A sign-up walkthrough | OTP, email verification, invite, slot screen were not personally exercised in the private app | Not verified |
| Two core-feature recommendations | Preliminary public-product recommendations recorded in PART-A-PRODUCT-RECOMMENDATIONS.md | Draft; applicant validation required |

## Security and integrity controls

The assignment baseline has strict JSON parsing, a 4 KiB streaming request body cap, allowlisted swipe fields, server-selected acting identity, active-profile lookup, self-swipe rejection, idempotent identical decisions, conflicting-decision rejection, safe error responses, private/no-store API responses, and security headers. The persistence layer enforces pair uniqueness, adult-only mock profiles, no self-swipes, valid decision directions, and mutual-match invariants.

The PostgreSQL branch retains these application controls and migrates database-level constraints to PostgreSQL. The PostgreSQL migration adds CHECK constraints and PL/pgSQL triggers for reciprocal-LIKE-only Match inserts/updates, immutable Swipe decision fields, and deletion of a Match when a supporting Swipe is removed. The SQL trigger behaviour and the transaction lock must be exercised by the new PostgreSQL CI run before acceptance.

### Concurrent reciprocal LIKEs

A race existed in which two users could LIKE each other at almost the same time. Under normal READ COMMITTED transaction isolation, each transaction might fail to see the other's uncommitted Swipe and both could commit without creating the Match. The hardening branch serializes the same unordered user pair with a transaction-scoped PostgreSQL advisory lock before reading/inserting a Swipe. A regression test starts both directed LIKE operations concurrently and asserts that both Swipe rows and exactly one canonical Match persist. This is a new test awaiting CI; it is not yet a verified passing result.

## Findings and release risk

### High — shared unauthenticated demo identity

The current-user adapter resolves a server-side `DEMO_USER_ID` (default `demo-user`). The client cannot choose another actor ID, but every visitor to an open public deployment would operate on the same demo user's feed and swipe history. A stranger could consume profiles, create demo matches, or change the public experience for everyone.

This matches the assignment's explicit single-logged-in-user/no-external-auth assumption. It is not an implementation defect against Part B, but it remains a production blocker for real users or a public interactive demo.

**Required before public exposure:** either add authentication and per-user ownership/authorization, or keep the application behind Vercel Deployment Protection and limit preview access to trusted reviewers. Merely changing the demo-user ID is not authentication.

### High — managed PostgreSQL is not yet provisioned

The hardening branch removes local SQLite persistence and requires a PostgreSQL URL, avoiding the instance-local database problem on Vercel Functions. However, no managed PostgreSQL resource is currently connected, and no live persistence test across separate serverless invocations has occurred.

**Required:** provision a supported managed PostgreSQL provider, use its pooled connection URL for runtime traffic where available, and its direct connection URL for Prisma migrations. Store both as server-side environment variables only. Run migrations, seed, and database acceptance tests against that exact provider before deploying the Preview.

### High — persistent rate limiting has not yet been configured

The API validates requests and limits body size, but an open endpoint still needs an edge-level abuse limit. An in-process memory counter would be unreliable across serverless instances.

**Required before opening a public URL:** configure Vercel Firewall custom rate-limit rules on `/swipe`, `/feed`, and `/matches`, keyed to the source IP, and verify the configured thresholds and HTTP 429 behaviour. Do not assume the rules are active until the project firewall configuration has been read back and a test deployment confirms them.

### Medium — baseline CSP permits inline script and style

The current Content Security Policy includes `'unsafe-inline'` for Next.js runtime/style compatibility. This is weaker than a nonce/hash-based policy. Tightening it requires testing the framework runtime and UI inline styling so the change does not break the app. Keep this visible as a residual risk rather than silently claiming a strict CSP.

### Medium — third-party placeholder image requests

Seeded fictional profile images currently use `i.pravatar.cc`. Browser requests disclose network metadata to the image host and add an external availability dependency. Use self-hosted project assets or a controlled image host before a privacy-sensitive public launch.

### Low — HSTS not yet verified

Do not claim HSTS is enabled until the actual HTTPS deployment and response headers have been tested. Configure Strict-Transport-Security only when the intended host is HTTPS-only and the max-age/subdomain policy is appropriate.

### Low — feed sizing and Matches query pattern

The feed returns all eligible profiles, appropriate for the 30-profile assignment fixture. The Matches use case currently fetches counterpart profiles separately, creating an N+1 query pattern as match counts grow. Add cursor pagination and a joined projection before scaling beyond the assignment demo.

### Low — CI action references are version tags

The current workflow uses major-version tags such as `actions/checkout@v4` and `actions/setup-node@v4`, not immutable commit SHAs. Dependabot is configured to monitor GitHub Actions; pinning verified SHAs would provide stronger supply-chain protection.

## Dependency and source review

- The original reviewed commit passed `npm audit --audit-level=high` with zero reported vulnerabilities. The changed dependency graph must be audited again after the PostgreSQL adapter lockfile is generated.
- Strict TypeScript and production Next.js build passed on the assignment baseline. The PostgreSQL branch must rerun both.
- First-party source, migrations, tests, Mermaid sources and SVG assets carry the YUGORA copyright notice, with a CI guard.
- No `eval()`, `new Function()`, `dangerouslySetInnerHTML`, or obvious hard-coded credential literal was found in the sampled first-party application files.
- The repository is all-rights-reserved; GitHub owner/commit attribution helps provenance but does not make copying impossible. The integration-created commits are not cryptographically signed.

A zero-vulnerability `npm audit` means the package audit reported no known vulnerable installed dependency versions at the time of the run. It does not scan custom source for logical flaws or prove the absence of vulnerabilities.

## Not yet performed

- PostgreSQL hardening-branch CI, including new migrations, triggers and reciprocal-concurrency regression test.
- Connection and migration verification against a provisioned managed PostgreSQL resource.
- Vercel Preview deployment, and persistence checks across separate serverless invocations.
- Vercel Firewall rule activation and rate-limit attack tests.
- Dynamic DAST against a deployed staging URL, OWASP ZAP/Burp campaign, load/soak tests, or cold-start benchmarking.
- Manual screen-reader testing and physical iOS/Android device testing.
- Multi-user authorization tests; authentication remains outside the assignment scope.
- Private Coy app walkthrough.

## Deployment recommendation

**Do not promote this app to a public Vercel deployment yet.** First pass PostgreSQL CI on the hardening branch. Then provision and test the managed database, configure Vercel project environment variables and deployment protection, apply and verify WAF rate limits, and perform a protected Preview acceptance pass. The shared demo identity means an unprotected preview is not safe for public interactive use. Only consider a public release after the identity/authentication decision is resolved and all cross-instance persistence and abuse-control checks pass.

## Final verdict

**Assignment Part B:** implemented and automated-tested on the SQLite baseline.  
**PostgreSQL hardening:** implemented on a separate feature branch; awaiting full CI.  
**Assignment Part A:** preliminary feature recommendations drafted from public product information; private in-app walkthrough remains unverified.  
**Production readiness:** not approved yet.  
**Confirmed critical vulnerabilities in the scoped baseline review:** none found; the remaining blockers and test limitations above are explicit.
