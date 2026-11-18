# Assignment Requirements Traceability

| Assignment requirement | Implementation | Gate | Status |
|---|---|---:|---|
| Standalone app; placeholder Home and Discover tab | Blank Home tab and functional Discover shell | 4 | Complete |
| React or Next.js, mobile-first | Next.js / React / TypeScript responsive interface | 4 | Complete |
| Node backend and JSON/SQLite/database | Next.js Route Handler-compatible API + Prisma + PostgreSQL on PR #8 (SQLite on main baseline) | 2–3 | Complete |
| Single logged-in user; no external auth | Server-side `CurrentUserPort`; acting ID is never accepted from the browser | 3 | Complete |
| At least 30 mock profiles | Deterministic idempotent seed | 2 | Complete |
| Name, age, photo, bio, city/college, interests | Profile entity and seed schema | 2 | Complete |
| Some profiles have already liked demo user | Incoming directed Swipe seed rows | 2 | Complete |
| One profile card at a time | Single active profile card and one-card feed progression | 4 | Complete |
| Right LIKE / left PASS | Shared swipe operation for drag and buttons | 4 | Complete |
| Mobile drag and desktop buttons | Pointer/touch drag plus desktop LIKE/PASS buttons | 4 | Complete |
| Smooth animation and clear feedback | Server-confirmed exit animation, pending and recoverable error states | 4 | Complete |
| Swiped profile never reappears | Prisma feed query excludes viewer-authored Swipe rows; HTTP regression test | 2–3 | Complete |
| Empty state | Dedicated empty-feed state and refresh action | 4 | Complete |
| Match only on mutual likes | Domain policy, repository verification and PostgreSQL triggers on PR #8 | 1–3 | Complete |
| Match celebration | Celebration opens only after server returns a confirmed Match DTO | 4 | Complete |
| Matches view of all mutual matches | Responsive Matches view backed by `GET /matches` | 4 | Complete |
| Never reveal non-mutual incoming likes | Directed Swipe model, public DTO allow-list and HTTP privacy tests | 1–3 | Complete |
| GET `/feed` | `app/feed/route.ts` | 3 | Complete |
| POST `/swipe` | `app/swipe/route.ts` | 3 | Complete |
| GET `/matches` | `app/matches/route.ts` | 3 | Complete |
| Persistence across reloads | PostgreSQL-backed Swipe and Match records on PR #8 (SQLite on main baseline) | 2–3 | Complete |


## Gate 5 — Browser and release QA

| Requirement | Verification | Status |
|---|---|---|
| Pass, Like, mutual match and Matches browser journeys | Playwright production-server Chromium suite | Complete |
| Swiped profile remains out of feed after reload | Playwright stateful API fixture plus PostgreSQL/HTTP persistence suites on PR #8 | Complete |
| Feed, swipe and matches failure recovery | Independent Playwright route-failure cases | Complete |
| Mobile pointer drag and desktop/keyboard actions | Browser viewport/gesture and keyboard tests | Complete |
| Reduced motion, dialog focus loop, Escape, accessible button names | Playwright accessibility-oriented checks | Complete |
| Empty feed and broken-image fallback | Playwright | Complete |
| Baseline browser security headers and no permissive CORS response | Production-server header assertions | Complete |
| Production identity, rate limiting, deployment and monitoring | Release configuration / operational work | Blocked; not part of assignment demo |

| Concurrent duplicate Like requests | HTTP integration race test asserts one directed swipe and one canonical mutual Match | Complete |
