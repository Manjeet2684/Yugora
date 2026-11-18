# Assignment Requirements Traceability

| Assignment requirement | Implementation | Gate | Status |
|---|---|---:|---|
| Standalone app; placeholder Home and Discover tab | Application shell and two-item navigation | 4 | Planned |
| React or Next.js, mobile-first | Next.js / React / TypeScript responsive UI | 4 | Planned |
| Node backend and JSON/SQLite/database | Next.js Route Handler-compatible API + Prisma + SQLite | 2–3 | Complete |
| Single logged-in user; no external auth | Server-side `CurrentUserPort`; acting ID is never accepted from the browser | 3 | Complete |
| At least 30 mock profiles | Deterministic idempotent seed | 2 | Complete |
| Name, age, photo, bio, city/college, interests | Profile entity and seed schema | 2 | Complete |
| Some profiles have already liked demo user | Incoming directed Swipe seed rows | 2 | Complete |
| One profile card at a time | `SwipeDeck` and `ProfileCard` | 4 | Planned |
| Right LIKE / left PASS | Shared swipe controller and mutation | 4 | Planned |
| Mobile drag and desktop buttons | Motion gestures + action bar | 4 | Planned |
| Smooth animation and clear feedback | Motion states and explicit success/error UI | 4 | Planned |
| Swiped profile never reappears | Prisma feed query excludes viewer-authored Swipe rows; HTTP regression test | 2–3 | Complete |
| Empty state | Successful empty feed response state | 4 | Planned |
| Match only on mutual likes | Domain policy, repository verification and SQLite triggers | 1–3 | Complete |
| Match celebration | Match DTO opens celebration only after server result | 4 | Planned |
| Matches view of all mutual matches | `GetMatchesUseCase` and `GET /matches` | 1–3 | Backend complete; UI planned |
| Never reveal non-mutual incoming likes | Directed Swipe model, public DTO allow-list and HTTP privacy tests | 1–3 | Complete |
| GET `/feed` | `app/feed/route.ts` | 3 | Complete |
| POST `/swipe` | `app/swipe/route.ts` | 3 | Complete |
| GET `/matches` | `app/matches/route.ts` | 3 | Complete |
| Persistence across reloads | SQLite-backed Swipe and Match records | 2–3 | Complete |
