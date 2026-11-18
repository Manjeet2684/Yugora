# ADR-002: Directed Swipe as the Source of Truth

**Status:** Accepted

## Context

The product must remember each person's decision and keep non-mutual incoming interest private. A separate incoming-like table could drift out of sync with the sender's decision.

## Decision

Represent every decision as one directed Swipe row with an actor, target, and direction. An incoming LIKE for the demo user is a LIKE authored by the other profile owner and targeted at the demo user. The feed excludes profiles only when the current demo user has already swiped on them.

## Consequences

- There is one durable representation of each directed decision.
- Incoming interest does not itself remove a profile from the feed.
- The feed projection can omit all incoming-interest information.
- A unique constraint on the actor-target pair prevents duplicate decisions.
