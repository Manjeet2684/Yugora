# Persistence model (Gate 2)

## Tables

- **User**: identity record keyed by the verified Neon Auth user ID, plus each fictional profile owner. The browser does not choose this identifier.
- **Profile**: one public discovery profile per user. `ownerUserId` is unique. Ages are constrained to 18+ by a PostgreSQL CHECK constraint.
- **Interest**: normalized, unique interest labels.
- **ProfileInterest**: composite-key join table for the many-to-many Profile/Interest relationship. `position` preserves display order.
- **Swipe**: one directed decision from `actorUserId` to `targetUserId`, with `LIKE` or `PASS`. The actor-target pair is unique. CHECK constraints reject self-swipes and unsupported directions.
- **Match**: confirmed mutual LIKE only. Participants are stored as a canonical lexicographically ordered pair and unique together.

## Privacy and correctness invariants

1. There is no incoming-likes table. A one-sided incoming LIKE is a normal directed Swipe with the demo user as target.
2. Feed eligibility excludes only profiles whose owner has already been targeted by a Swipe from the current viewer. Incoming swipes do not affect feed eligibility.
3. The feed repository projects domain Profile fields and never includes swipe/match relations.
4. Only `RecordSwipeUseCase` decides whether reciprocal LIKE creates a match.
5. The Unit of Work wraps outgoing Swipe persistence, reciprocal decision lookup, and Match creation in one interactive Prisma transaction. PostgreSQL transaction-scoped advisory locks serialize opposite-direction decisions for the same unordered user pair so simultaneous reciprocal LIKEs cannot both miss each other's committed decision.
6. Unique indexes prevent duplicate directed decisions and duplicate participant pairs. PostgreSQL CHECK constraints additionally enforce no self-swipe, allowed direction values, adult profile age, and canonical match ordering.
7. PostgreSQL PL/pgSQL triggers prevent inserting/updating a Match unless both directed LIKE rows exist.
8. Persisted swipe actor, target, and direction fields are immutable; deleting either supporting swipe automatically removes the pair's Match, including during account/profile-owner cleanup.

The CHECK constraints and PL/pgSQL trigger functions are authored in SQL migrations because Prisma's schema DSL does not express these database-level predicates and trigger bodies. Preserve them when editing or regenerating migrations.

## Authentication and user profile

Neon Auth manages email OTP sign-in and its session records in the separate `neon_auth` schema. YUGORA resolves the authenticated user from the first-party HttpOnly session cookie on the server, then creates or resolves the matching application `User` row. Each signed-in user can own one editable `Profile`; interests are stored through the normalized Interest/ProfileInterest relation. The email address is not included in public discovery DTOs.

A local/CI-only identity adapter is enabled only by `YUGORA_TEST_IDENTITY=demo` or development mode when Neon Auth is not configured. It is not a production fallback.

## Seed data

`prisma/seed.ts` creates 30 fictional profile owners with age, locally generated SVG data-URL avatar, short bio, city, and normalized interests. It creates eight incoming LIKE Swipe rows targeting the demo user. Seeding is idempotent: stable user/profile IDs and compound upserts prevent duplicate rows; only interest links for seeded profiles are rebuilt.
