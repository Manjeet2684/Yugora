# ADR-004: Enforce Mutual-Match Integrity in Persistence

**Status:** Accepted

## Context

The product's core promise is that a Match exists if and only if both participants have persisted a LIKE toward the other. Application-level checks alone are insufficient because repositories, tests, future maintenance scripts, or other services could insert a Match without going through `RecordSwipeUseCase`.

## Decision

Enforce the invariant in three places:

- `RecordSwipeUseCase` checks reciprocal LIKE decisions before it asks to persist a match.
- `PrismaMatchRepository.createIfAbsent` checks both directed Swipe rows through its transaction-scoped Prisma executor.
- PostgreSQL PL/pgSQL triggers reject Match insertion or participant-pair updates without reciprocal LIKE rows.

Swipe actor, target, and direction are immutable once persisted. Deleting either supporting swipe removes the corresponding Match, preventing stale matches from surviving data cleanup.

## Consequences

- Invalid matches are rejected even when the application use case is bypassed.
- The invariant is protected within the same PostgreSQL transaction used by the use case.
- Existing matches cannot outlive either supporting swipe.
- Deleting a Swipe intentionally removes the corresponding Match; swipe deletion is not a user-facing undo feature in the assignment.
- PostgreSQL trigger definitions live in a versioned migration and must be preserved when schema migrations are regenerated.
