# YUGORA — Senior Engineering and Security Review

**Review date:** 18 November 2026  
**Repository baseline:** d11b72e167c1f9517f4380bad3c2b9d635574108  
**Review type:** Static code review, requirements traceability, automated integration/browser testing, and focused attack-case verification.  
**Not claimed:** This is not a certified penetration test, external DAST engagement, load test, legal opinion, or production security sign-off.

## Executive assessment

The assignment's Part B functional requirements are implemented and covered by automated tests. The latest GitHub Actions run passed the production build, dependency audit, 14 architecture tests, 10 persistence tests, 9 HTTP tests, 5 UI gesture tests, and 16 Chromium browser tests (54 automated tests total). The latest browser suite includes an unmocked SQLite-backed full-stack journey and native touchscreen pointer input.

No critical exploit was confirmed in the scoped code review. That does not mean the project is bulletproof. The application is still an assignment demo with a shared server-side user identity and local SQLite persistence. Those are deliberate assignment shortcuts, but they are production blockers—especially for Vercel.

## Assignment acceptance matrix

| Client requirement | Evidence | Assessment |
|---|---|---|
| Standalone React/Next.js app | Next.js App Router and React UI | Pass |
| Blank Home tab and functional Discover tab | Browser test verifies Home has no content and Discover works | Pass |
| At least 30 mock profiles with required fields | Deterministic seed creates 30 fictional profiles with age, photo, bio, city and interests | Pass |
| Some profiles already liked the demo user | Seed creates eight directed incoming LIKE rows | Pass |
| One profile card at a time | Browser test asserts a single active .profile-card | Pass |
| Right LIKE / left PASS | Pure gesture tests, desktop buttons, keyboard and native touch browser journey | Pass |
| Card animation and feedback | UI waits for server response before exit; failure retains active profile | Pass |
| A swiped profile never reappears | SQLite repository test plus unmocked browser reload journey | Pass |
| Empty state | Unit/UI and browser coverage | Pass |
| Mutual-only Match | Use case, repository guard, SQLite triggers, HTTP tests and real browser match journey | Pass |
| Matches view only contains mutual matches | SQLite/HTTP and browser test | Pass |
| Incoming one-sided interest never exposed | Feed and Matches privacy assertions | Pass |
| GET /feed, POST /swipe, GET /matches | Route handlers and real-SQLite HTTP tests | Pass |
| Swipes/matches persist across reload | Unmocked full-stack Playwright journey | Pass |
| Coy Part A sign-up walkthrough | OTP, email verification, invite, slot screen were not personally exercised in the private app | Not verified |
| Two core-feature recommendations | Preliminary public-product recommendations recorded in PART-A-PRODUCT-RECOMMENDATIONS.md | Draft; applicant review required |

## Automated and manual attack-case review

| Attack / edge case | Observed control | Result |
|---|---|---|
| Client forges actorUserId | Unknown request keys are rejected; current actor is selected server-side | 400 |
| Extra/unexpected JSON keys | Strict allowlist accepts only profileId and direction | 400 |
| Malformed JSON / wrong content type | Bounded parser and explicit content-type validation | 400 / 415 |
| Oversized swipe body | 4 KiB streaming body limit plus Content-Length check | 413 |
| Unknown profile | Active-profile lookup and safe error mapping | 404 |
| Self-swipe | Application rule rejects acting on own profile | 400 |
| Conflicting retry (PASS then LIKE) | Immutable directed decision; conflict mapping | 409 |
| Duplicate identical LIKE | Unique actor-target key, transactional upsert and concurrent-request test | One canonical Swipe and one Match |
| One-sided incoming LIKE | Feed and Matches projections never expose sender/incoming-like metadata | No leak in tested DTOs |
| Direct invalid Match insert/update | Repository validation and SQLite triggers | Rejected |
| Delete a supporting LIKE | SQLite trigger removes the stale Match | Enforced |
| Internal database error details | Generic error DTO; no SQL/path/stack leakage in response | Redacted |
| Cross-origin browser access | No permissive CORS response header; browser header assertion | No CORS grant |
| Broken third-party avatar | Image error fallback to initials | Graceful fallback |
| Keyboard/modal interaction | Arrow actions, Escape dismissal, focus trap and focus restoration | Browser tests pass |

## Findings and release risk

### High — shared unauthenticated demo identity

The current-user adapter resolves a server-side DEMO_USER_ID (default demo-user). The client cannot choose another actor ID, but every visitor to a public deployment would operate on the same demo user's feed and swipe history. A stranger can consume profiles, create demo matches, or alter the public experience for everyone.

This matches the assignment's explicit “single logged-in user / no external auth” assumption. It is not an implementation defect against Part B, but it is a blocker for a multi-user or real-user launch.

**Required before production:** real authentication, a trusted server-side session, per-user ownership checks, and tests proving one user cannot read or mutate another user's feed/swipes/matches.

### High — SQLite file is not suitable as Vercel persistent storage

The current adapter uses better-sqlite3 and a local file:./prisma/dev.db database. Vercel Functions have a read-only filesystem apart from temporary /tmp scratch space. A SQLite file written to a function instance's local filesystem is not a durable, shared database across deployments or instances.

**Required before Vercel production:** move Prisma to a managed database. For this Prisma project, Prisma Postgres or a compatible managed PostgreSQL provider is the simplest conventional option. The SQLite-specific migrations and triggers must be ported to PostgreSQL, and CI must run against PostgreSQL before the deployment is accepted.

### Medium — no durable API rate limiting / abuse controls

The public POST /swipe route has strict input validation and a body-size cap, but no persistent per-IP/per-user quota or distributed rate limiter. With the shared demo identity, a scripted visitor can exhaust the feed or generate unnecessary database writes.

**Required before public demo exposure:** edge/WAF limits or a distributed rate limiter (for example, Vercel Marketplace Redis/Upstash) with an explicit policy for /swipe, /feed, and /matches. An in-process memory counter is not an adequate serverless control.

### Medium — baseline CSP permits inline script and style

The current CSP includes 'unsafe-inline' for Next.js runtime compatibility and inline style attributes. This is weaker than a nonce/hash-based CSP. There is no observed DOM XSS sink such as dangerouslySetInnerHTML in the reviewed UI, and profile content is rendered as escaped React text, but the policy should be tightened when the deployment configuration is selected.

### Medium — third-party placeholder image requests

Seeded fictional profile images use i.pravatar.cc. This is acceptable placeholder data for the assignment, but it sends browser image requests to an external image host and adds availability/dependency risk. Use locally stored project assets or a controlled image host for a production demo, with a restrictive allowlist.

### Low — no HSTS before HTTPS deployment

HSTS is intentionally not emitted while there is no configured HTTPS domain. Add Strict-Transport-Security only after HTTPS is configured and verified for the target domain (with an appropriate max-age and subdomain policy).

### Low — feed sizing and Matches query pattern

The current feed returns all eligible profiles, which is reasonable for the required 30-profile seed. The Matches use case fetches each counterpart profile separately, creating an N+1 pattern as match counts grow. Add cursor pagination and an include/join query before operating at larger scale.

### Low — CI action references are version tags

The workflow uses major-version tags such as actions/checkout@v4 and actions/setup-node@v4, not immutable commit SHAs. Dependabot is configured to monitor GitHub Actions, but pinning to verified SHAs is stronger supply-chain hardening.

## Dependency and source review

- npm audit --audit-level=high passed with zero reported vulnerabilities on the reviewed commit.
- Strict TypeScript and production Next.js build passed.
- The reviewed first-party app, domain, application, persistence, HTTP, UI, tests, SQL migrations, Mermaid sources and SVG assets carry the YUGORA copyright notice.
- No eval(), new Function(), dangerouslySetInnerHTML, or obvious hard-coded credential literal was found in the sampled first-party application files.
- A repository test now checks copyright headers for new first-party source/config/asset files. Framework-generated next-env.d.ts and generated Prisma Client output are intentionally excluded; JSON manifests identify the author in metadata.

A zero-vulnerability npm audit means the package audit reported no known vulnerable installed dependency versions at the time of the run; it does not scan custom source for logical flaws or establish absence of vulnerabilities.

## Not yet performed

- External dynamic DAST against a deployed staging URL (there is no deployed URL).
- Load, soak, and adversarial concurrency tests beyond the targeted duplicate-LIKE test.
- Full OWASP ZAP/Burp test campaign, serverless cold-start benchmarking, or WAF/rate-limit verification.
- Manual screen-reader testing and physical iOS/Android device testing.
- A real multi-user authorization test, because authentication is intentionally absent from the assignment.
- Vercel deployment test, because the current local SQLite persistence adapter is not deployable as durable Vercel storage.

## Deployment recommendation

**Do not deploy the current SQLite build as a public Vercel demo yet.** Keep the verified SQLite branch as the assignment reference. Create a deployment branch that migrates Prisma and the match-integrity triggers to managed PostgreSQL, add a durable rate limiter, and either explicitly label the shared single-user environment demo-only or add real authentication. Only then deploy a Vercel Preview, test persistence across separate function invocations, and promote it to a public demo.

## Final verdict

**Assignment Part B:** implemented and automated-tested.  
**Assignment Part A:** recommendations drafted from public product information; private in-app walkthrough remains unverified.  
**Production readiness:** not approved yet.  
**Confirmed critical vulnerabilities in the reviewed code:** none found in this scoped review; several explicit release blockers remain as documented above.
