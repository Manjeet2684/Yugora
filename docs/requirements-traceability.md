# Assignment Requirements Traceability

| Assignment requirement | Planned implementation | Gate |
|---|---|---:|
| Standalone app; placeholder Home and Discover tab | Application shell and two-item navigation | 4 |
| React or Next.js, mobile-first | Next.js / React / TypeScript responsive UI | 4 |
| Node backend and JSON/SQLite/database | Next.js Route Handlers + Prisma + SQLite | 2–3 |
| Single logged-in user; no external auth | Server-side `CurrentUserPort` | 3 |
| At least 30 mock profiles | Deterministic idempotent seed | 2 |
| Name, age, photo, bio, city/college, interests | Profile entity and seed schema | 2 |
| Some profiles have already liked demo user | Incoming directed Swipe seed rows | 2 |
| One profile card at a time | `SwipeDeck` and `ProfileCard` | 4 |
| Right LIKE / left PASS | Shared swipe controller and mutation | 4 |
| Mobile drag and desktop buttons | Motion gestures + action bar | 4 |
| Smooth animation and clear feedback | Motion states and explicit success/error UI | 4 |
| Swiped profile never reappears | Feed excludes viewer-authored Swipe rows | 2–3 |
| Empty state | Successful empty feed response state | 4 |
| Match only on mutual likes | `isMutualLike` domain policy | 1–3 |
| Match celebration | Match DTO opens celebration only after server result | 4 |
| Matches view of all mutual matches | `GetMatchesUseCase` and GET `/matches` | 1–3 |
| Never reveal non-mutual incoming likes | Directed Swipe model, feed policy, allow-listed DTOs | 1–3 |
| GET `/feed` | Contract and use case | 1–3 |
| POST `/swipe` | Contract and use case | 1–3 |
| GET `/matches` | Contract and use case | 1–3 |
| Persistence across reloads | SQLite-backed Swipe and Match records | 2–3 |
