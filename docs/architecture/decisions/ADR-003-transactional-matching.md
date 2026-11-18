# ADR-003: Transactional Matching

**Status:** Accepted

## Context

A match must exist only after both participants have recorded LIKE decisions. A partial write must not leave a swipe persisted while its corresponding match creation has failed.

## Decision

Record the outgoing swipe, inspect the reciprocal decision, and create a canonical Match within one Unit of Work / database transaction. Enforce uniqueness for swipe direction and canonical match pairs at the persistence layer. Same-direction retries are idempotent.

## Consequences

- Matching remains a server-side decision.
- Failed match persistence rolls back the new swipe.
- Concurrent requests converge on one swipe and one match, subject to database uniqueness constraints.
- The frontend displays a match celebration only after the API confirms matched=true.
