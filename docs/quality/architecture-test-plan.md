# Architecture Test Plan

Gate 1 uses in-memory adapters to test the domain and application contracts.

## Verified cases

- Mutual matching requires two reciprocal LIKE decisions.
- Feed excludes profiles already swiped on by the current user.
- Reciprocal seeded LIKE creates a match after the current user's LIKE.
- A one-sided LIKE does not create a match.
- PASS never creates a match.
- Same-decision retries are idempotent.
- Opposite decision after an existing directed swipe is rejected as a conflict.
- Matches query returns persisted mutual match records only.
- Canonical match pair is independent of user ordering.
- Failed match persistence rolls back the newly inserted swipe.
- Self-swipes, invalid directions, and unknown profiles are rejected.
- Concurrent identical LIKE requests converge to one swipe and one match.

## Deferred tests

Gate 2/3 add Prisma and SQLite integration tests, uniqueness/transaction checks, HTTP validation and privacy regression tests. Gate 4/5 add Playwright user journeys, responsive layout, keyboard interaction, reduced-motion and accessibility checks.
