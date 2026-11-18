# ADR-002: Represent All Interest as Directed Swipe Records

- **Status:** Accepted
- **Decision:** Gate 1

## Context

The assignment requires seeded profiles that have already liked the demo user, while strictly forbidding disclosure of incoming non-mutual interest. A separate incoming-like table would duplicate a concept already represented by a directed user decision.

## Decision

Store each participant decision in one `Swipe` model with `actorUserId`, `targetUserId`, and `direction` (`LIKE` or `PASS`). A seeded incoming LIKE is a row from the profile owner's user ID to the demo user's ID. The feed excludes profiles only when the demo user is the actor of a Swipe to that profile owner.

## Consequences

- Incoming and outgoing decisions share one source of truth.
- A pre-liked profile remains eligible for Discover until the demo user acts.
- A reciprocal LIKE can be checked with a reverse actor/target lookup.
- Unique `(actorUserId, targetUserId)` constraints prevent duplicate directed decisions.
- No API needs to expose incoming-like records or flags.
