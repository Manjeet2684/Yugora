# YUGORA Quality and Regression Test Plan

> The SQLite language below records the original Gate 2/3 test baseline. The current `feature/postgres-production-hardening` branch executes persistence, HTTP and browser integration against PostgreSQL 16. Its latest verified code run is [44394511084](https://github.com/Manjeet2684/Yugora/actions/runs/44394511084): 65 tests passed, including the exact Vercel migration/seed/build command and 16 Chromium journeys.

## Gate 1 — Architecture (in-memory adapters)

- Reciprocal LIKE is required for matching.
- Incoming LIKE does not remove a profile from the viewer's feed.
- A viewer-authored LIKE or PASS removes that target from future feed results.
- Public DTO projection excludes internal persistence fields and incoming-interest metadata.
- Same-direction retries are idempotent; opposite decisions conflict.
- Failed match persistence rolls back the swipe.
- Self-swipes and invalid directions are rejected.

## Gate 2 — Persistence (current PostgreSQL; SQLite was the historical baseline)

- PostgreSQL migrations deploy to a fresh PostgreSQL 16 database in CI.
- Seed is repeatable and creates exactly 30 profiles plus at least eight incoming likes.
- Foreign keys, unique indexes and CHECK constraints are enforced.
- Unit of Work rollback is verified against PostgreSQL.
- Repository refuses a Match without two persisted reciprocal LIKEs.
- PostgreSQL triggers reject invalid Match inserts/participant updates.
- Persisted Swipe decisions are immutable; removing a supporting LIKE removes its Match.

## Gate 3 — HTTP API (real PostgreSQL behind route adapter)

- `GET /feed` returns only public profiles, excludes previously swiped targets and does not expose incoming likes.
- `POST /swipe` records LIKE/PASS, resolves mutual matches from persisted state and returns stable response DTOs.
- `GET /matches` returns confirmed mutual matches only.
- Repeated identical POSTs are idempotent; an opposite decision returns 409.
- Invalid JSON, wrong content type, oversized bodies, unknown keys, caller-supplied actor IDs, invalid directions and self-swipes are rejected.
- Unknown/inactive profile is 404; transient database unavailability maps to 503.
- Unexpected errors return generic messages without stack traces, SQL, adapter details or paths.
- Success and error responses are private/no-store and include `X-Content-Type-Options: nosniff`.
- All required routes are exposed at the exact root paths `/feed`, `/swipe`, and `/matches`.

## Gate 4 — UI interaction logic

- Right drag beyond threshold maps to LIKE; left drag maps to PASS.
- Short, vertical-dominant and invalid gestures never submit a swipe.
- Gesture tilt is bounded and has no persistence authority.
- Desktop buttons and pointer gestures call the same swipe mutation.
- Card exit and match celebration wait for server confirmation.
- Request failures preserve the active card and allow retry.
- Empty feed, matches-empty, loading and error states are distinct.
- Keyboard left/right shortcuts provide an equivalent interaction path.
- Reduced-motion preferences disable non-essential animation.

## Gate 5 — Browser and release

### Browser QA implemented
- [x] Chromium runs against the built Next.js production server in CI.
- [x] Pass, one-sided Like, mutual-match celebration and Matches rendering journeys.
- [x] Concurrent identical mutual-LIKE requests converge on one Swipe and one canonical Match row in PostgreSQL.
- [x] Swipe decision remains absent from the feed after reload (deterministic server fixture); PostgreSQL/HTTP tests verify persisted decisions.
- [x] Empty feed, feed failure/retry, swipe failure/retry and matches failure/retry.
- [x] Desktop action buttons, native Chromium mobile touchscreen drag and keyboard arrows call the same swipe operation.
- [x] Broken profile image falls back to initials.
- [x] Match dialog receives focus, traps Tab/Shift+Tab, closes on Escape and restores focus when possible.
- [x] Reduced-motion preference and accessible button names.
- [x] Mobile viewport navigation, card visibility and horizontal-overflow check.
- [x] Baseline response security headers and absence of permissive CORS response headers.

### Public release blockers (not signed off)
- [ ] Replace the shared assignment demo identity with real per-user authentication/authorization.
- [x] Configure an active Vercel IP-based rate limit (20 requests / 60 seconds) for `GET /feed`, `POST /swipe`, and `GET /matches`.
- [ ] Verify HTTP 429 behavior against a protected deployed Preview.
- [x] Create and link the Vercel project; SSO deployment protection is enabled.
- [ ] Connect Neon, deploy a protected Preview, and verify secrets/branching/persistence.
- [ ] Verify HTTPS, monitoring and alerting on a deployment.
- [ ] Revisit CSP with a nonce/hash strategy and deployment-specific policy before tightening inline script allowances.
- [ ] Perform manual assistive-technology and real-device touch testing before launch.

- Playwright journeys for pass, like, mutual match, reload, empty feed and request failure.
- Mobile drag and desktop button paths use the same mutation.
- Reduced-motion and keyboard controls remain functional.
- Simulate image, feed, swipe and matches failures independently.
- Verify responsive layouts and accessibility.
- Review deployment-specific security headers, origin policy and platform rate limits before public release.
