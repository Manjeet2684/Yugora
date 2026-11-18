# ADR-003: Persist Swipe and Match Atomically

- **Status:** Accepted
- **Decision:** Gate 1

## Context

A match is a consequence of a newly persisted LIKE when a reciprocal LIKE already exists. If the outgoing Swipe is saved but Match creation fails, the application must not report a successful match or leave ambiguous partial state.

## Decision

`RecordSwipeUseCase` executes the outgoing Swipe write, reciprocal decision lookup, and optional Match creation inside one `UnitOfWorkPort` transaction. Repository ports expose atomic create-if-absent operations to handle uniqueness races and retries.

## Consequences

- A transaction failure rolls back the swipe and match changes together.
- A retry of the same decision is safe.
- An opposite decision for the same directed pair is a conflict.
- The persistence adapter must enforce database uniqueness constraints and provide atomic upsert/read behavior.
