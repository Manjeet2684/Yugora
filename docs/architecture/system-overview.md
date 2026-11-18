# System Overview

## Context

Coy Discover is a standalone implementation for the SDE intern assignment. The application has a single server-configured demo user, a Discover feed, a Matches view, and a deliberately blank Home placeholder. It does not integrate with Coy's production codebase.

## Logical layers

### Presentation and delivery

- React components render profile cards, gesture feedback, navigation, match celebration, and error/empty states.
- Next.js Route Handlers expose the three required HTTP operations.
- Route handlers validate request boundaries and translate application errors into HTTP responses.
- The UI never connects to persistence directly.

### Application

- `GetFeedUseCase` obtains the configured viewer and asks the profile repository for eligible profiles.
- `RecordSwipeUseCase` validates the target and decision, persists the directed decision, checks for the reciprocal LIKE, and creates a match inside one Unit of Work.
- `GetMatchesUseCase` reads persisted matches for the configured viewer and resolves each counterpart's public profile.

### Domain

- `Profile` represents a discoverable profile and contains no interest/like flags.
- `SwipeDecision` is a directed decision from one user to another (`LIKE` or `PASS`).
- `Match` stores a canonical participant pair.
- `isMutualLike` is the only policy used to determine match eligibility.

### Infrastructure

Gate 1 defines adapter interfaces only. Gate 2 will implement Prisma repositories and the SQLite Unit of Work. This separation lets persistence change without rewriting domain policy or use cases.

## End-to-end data flow

### Feed

1. Browser requests `GET /feed`.
2. HTTP adapter calls `GetFeedUseCase`.
3. Use case obtains the demo user from `CurrentUserPort`.
4. `ProfileRepositoryPort.listEligibleForViewer` returns active profiles without a decision authored by the demo user.
5. Application maps each entity to an allow-listed `PublicProfileDto`.

The feed query does not disclose or annotate incoming likes.

### Swipe

1. Browser posts `{ profileId, direction }` to `POST /swipe`.
2. HTTP adapter validates the request and invokes `RecordSwipeUseCase`.
3. Use case resolves the demo identity and opens `UnitOfWorkPort.execute`.
4. It resolves the active target profile, rejects self-swipes, and checks for an existing decision.
5. A same-direction retry is idempotent; an opposite decision is a conflict.
6. A new decision is persisted using the repository's atomic create-if-absent operation.
7. Only a `LIKE` checks for a reciprocal `LIKE`.
8. If both directed decisions are LIKE, the use case creates a canonical match in the same transaction.
9. The transaction commits before the HTTP adapter returns success.

### Matches

1. Browser requests `GET /matches`.
2. Use case obtains the configured demo user.
3. Match repository returns persisted match rows involving that user.
4. The counterpart profile is resolved and explicitly projected to a public DTO.

No pending/non-mutual likes are queried for display.

## State ownership

| State | Owner |
|---|---|
| Swipe history | Database |
| Match records | Database |
| Eligible feed | Derived by backend from profiles and viewer-authored swipes |
| Current card and gesture offset | Frontend transient state |
| Pending request / toast / modal | Frontend transient state |
| Current user identity | Server-side `CurrentUserPort` |

## Runtime boundary

The intended runtime is a Node.js Next.js application. Database-backed route handlers must use the Node.js runtime. The browser and server use same-origin HTTP, avoiding a separate API port and CORS configuration for this assignment.

For deployment, SQLite must live on storage with persistence guarantees. An ephemeral serverless filesystem or multiple uncoordinated local database copies are not acceptable for durable swipe history.
