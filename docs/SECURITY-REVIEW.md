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

## Known release limitations

### Shared demo identity

The assignment permits one assumed logged-in user and no external authentication. YUGORA uses a server-configured `DEMO_USER_ID`, so visitors to an unprotected deployment would share one mutable swipe history and match list.

Keep Preview protected by Vercel SSO. This is assignment-compliant but is not a production multi-user identity system.

### Managed database and Preview

The Neon Marketplace integration is installed, but the Vercel integration read-back currently reports no connected Neon project. The Vercel project has no deployment, domain or project environment variables. PostgreSQL CI validates the migrations against PostgreSQL 16; it does not prove managed Neon or hosted Function behavior.

Connect Neon, deploy a protected Preview and verify variable names, migrations, repeatable seeding and persistence across separate invocations before considering acceptance complete.

### Browser and platform security

The current CSP permits `'unsafe-inline'` for Next.js compatibility; it is a baseline, not a strict nonce/hash CSP. HSTS, actual edge HTTP 429 behavior and deployed headers have not been verified against a live Preview.

Physical iOS/Android testing, manual screen-reader review, external DAST and load/soak testing have not been performed. Do not represent them as completed.

### Part A

The private Coy OTP, add-crush, email verification, invite and extra-slots walkthrough remains outstanding. The recommendations in `docs/PART-A-PRODUCT-RECOMMENDATIONS.md` are explicitly preliminary.

## Release decision

Part B code is ready for protected Preview acceptance after the latest code changes pass CI. Hosted acceptance and Part A remain open. Do not merge PR #8 or expose an unrestricted public interactive demo until the release gates are closed.
