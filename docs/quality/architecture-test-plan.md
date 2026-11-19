# Quality and Regression Test Plan

## Architecture and domain

- Mutual matching requires two reciprocal LIKE decisions.
- Incoming LIKE does not remove a profile from the viewer's feed.
- A viewer-authored LIKE or PASS removes that target from future feed results.
- Public DTOs exclude persistence identifiers and incoming-interest metadata.
- Identical retries are idempotent; opposite decisions conflict.
- Self-swipes and invalid directions are rejected.

## PostgreSQL persistence

- Deploy migrations to a fresh PostgreSQL 16 database.
- Run the seed repeatedly and verify 30 profiles plus eight incoming demo likes.
- Verify foreign keys, unique indexes, CHECK constraints and trigger behavior.
- Verify Unit of Work rollback.
- Reject Match creation without reciprocal LIKEs.
- Verify swipe decisions cannot be changed and stale matches are removed.
- Run simultaneous reciprocal LIKEs and verify one canonical Match.

## HTTP boundary

- Verify `GET /feed`, `POST /swipe` and `GET /matches` contracts.
- Verify privacy, no-repeat eligibility and explicit DTO fields.
- Reject malformed JSON, wrong content type, oversized bodies, invalid UTF-8, unknown fields, actor overrides, invalid directions and self-swipes.
- Verify stable 400, 404, 409, 413, 415, 500 and retryable 503 responses.
- Verify private/no-store headers and generic unexpected-error responses.

## UI and browser

- One active profile card; desktop buttons and mobile drag invoke the same mutation.
- Card exits only after server confirmation; failures preserve the card for retry.
- Swipe feedback, mutual-match celebration and Matches display follow server results.
- Home stays blank; empty, loading and error states are distinct.
- Keyboard shortcuts do not activate while a button or editable control has focus.
- Reduced-motion preferences disable non-essential motion.
- Verify keyboard focus, modal Escape behavior, responsive layout and touch interaction.
- Verify hover polish on pointer devices without changing swipe gestures.

## Hosted release checks

- [x] Connect a Neon PostgreSQL project and create a dedicated Preview branch.
- [x] Configure branch-scoped pooled runtime and direct migration URLs; keep Production variables absent.
- [x] Keep Vercel SSO protection enabled.
- [x] Deploy the candidate branch to a protected Preview.
- [x] Apply both migrations and verify the idempotent seed (30 profiles, eight incoming likes, zero matches).
- [x] Smoke-check protected `GET /`, `GET /feed` (30 profiles) and `GET /matches` (zero matches).
- [x] Verify HTTPS, HSTS, private/no-store cache behavior and baseline response security headers.
- [ ] Exercise hosted `POST /swipe`, reciprocal-match creation and persistence across separate Function invocations.
- [ ] Verify the Firewall produces HTTP 429 at the configured threshold.
- [ ] Complete manual assistive-technology and physical-device checks.
- [ ] Complete the private Coy walkthrough and validate Part A recommendations.
