# API Contract Baseline

The API is designed around one server-configured demo user. The browser does not submit an actor user ID.

## GET /feed

Returns active profiles that the current demo user has not already swiped on. A profile that has liked the demo user remains eligible until the demo user makes a decision.

The response contains public profile fields only. It must not contain incoming-like flags, incoming-like counts, swipe records, or hidden-interest metadata.

## POST /swipe

Request body: { "profileId": "profile-123", "direction": "LIKE" }

Allowed directions: LIKE and PASS.

The operation records the directed decision, checks for an existing reciprocal LIKE, and creates a match in the same transaction when both directions are LIKE. A retry of the same decision is idempotent. A conflicting second decision for the same directed pair returns a conflict.

The response includes the recorded swipe, a matched boolean, and match details only if reciprocal LIKE exists.

## GET /matches

Returns persisted mutual matches for the server-configured demo user. A one-sided incoming LIKE is never a match and must never appear here.

## Error semantics

- 400: malformed input or unsupported direction.
- 404: target profile does not exist or is unavailable.
- 409: an incompatible decision already exists for the same directed pair.
- 500: unexpected failure; do not expose stack traces or database details.

Responses containing user-specific data should be private and non-cacheable.
