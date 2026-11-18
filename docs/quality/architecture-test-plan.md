# YUGORA Quality and Regression Test Plan

## Gate 1 — Architecture (in-memory adapters)

- Reciprocal LIKE is required for matching.
- Incoming LIKE does not remove a profile from the viewer's feed.
- A viewer-authored LIKE or PASS removes that target from future feed results.
- Public DTO projection excludes internal persistence fields and incoming-interest metadata.
- Same-direction retries are idempotent; opposite decisions conflict.
- Failed match persistence rolls back the swipe.
- Self-swipes and invalid directions are rejected.

## Gate 2 — Persistence (real SQLite)

- Migrations deploy to a fresh SQLite database.
- Seed is repeatable and creates exactly 30 profiles plus at least eight incoming likes.
- Foreign keys, unique indexes and CHECK constraints are enforced.
- Unit of Work rollback is verified against SQLite.
- Repository refuses a Match without two persisted reciprocal LIKEs.
- SQLite triggers reject invalid Match inserts/participant updates.
- Persisted Swipe decisions are immutable; removing a supporting LIKE removes its Match.

## Gate 3 — HTTP API (real SQLite behind route adapter)

- `GET /feed` returns only public profiles, excludes previously swiped targets and does not expose incoming likes.
- `POST /swipe` records LIKE/PASS, resolves mutual matches from persisted state and returns stable response DTOs.
- `GET /matches` returns confirmed mutual matches only.
- Repeated identical POSTs are idempotent; an opposite decision returns 409.
- Invalid JSON, wrong content type, oversized bodies, unknown keys, caller-supplied actor IDs, invalid directions and self-swipes are rejected.
- Unknown/inactive profile is 404; transient database unavailability maps to 503.
- Unexpected errors return generic messages without stack traces, SQL, adapter details or paths.
- Success and error responses are private/no-store and include `X-Content-Type-Options: nosniff`.
- All required routes are exposed at the exact root paths `/feed`, `/swipe`, and `/matches`.

## Gate 4/5 — Browser and release

- Playwright journeys for pass, like, mutual match, reload, empty feed and request failure.
- Mobile drag and desktop button paths use the same mutation.
- Reduced-motion and keyboard controls remain functional.
- Simulate image, feed, swipe and matches failures independently.
- Verify responsive layouts and accessibility.
- Review deployment-specific security headers, origin policy and platform rate limits before public release.
