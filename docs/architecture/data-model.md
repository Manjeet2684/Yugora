# Persistence model (Gate 2)

## Tables

- **User**: identity record for the single demo user and each mock profile owner. No external authentication is introduced.
- **Profile**: one public discovery profile per user. `ownerUserId` is unique. Ages are constrained to 18+ in SQLite.
- **Interest**: normalized, unique interest labels.
- **ProfileInterest**: composite-key join table for the many-to-many Profile/Interest relationship. `position` preserves display order.
- **Swipe**: one directed decision from `actorUserId` to `targetUserId`, with `LIKE` or `PASS`. The actor-target pair is unique. CHECK constraints reject self-swipes and unsupported directions.
- **Match**: confirmed mutual LIKE only. Participants are stored as a canonical lexicographically ordered pair and unique together.

## Privacy and correctness invariants

1. There is no incoming-likes table. A one-sided incoming LIKE is a normal directed Swipe with the demo user as target.
2. Feed eligibility excludes only profiles whose owner has already been targeted by a Swipe from the current viewer. Incoming swipes do not affect feed eligibility.
3. The feed repository projects domain Profile fields and never includes swipe/match relations.
4. Only `RecordSwipeUseCase` decides whether reciprocal LIKE creates a match.
5. The Unit of Work wraps outgoing Swipe persistence, reciprocal decision lookup, and Match creation in one interactive Prisma transaction.
6. Unique indexes prevent duplicate directed decisions and duplicate participant pairs. SQLite CHECK constraints additionally enforce no self-swipe, allowed direction values, adult profile age, and canonical match ordering.
7. SQLite triggers prevent inserting/updating a Match unless both directed LIKE rows exist.
8. Persisted swipe actor, target, and direction fields are immutable; deleting either supporting swipe automatically removes the pair's Match, including during account/profile-owner cleanup.

The CHECK constraints are authored in the SQL migration because Prisma's SQLite schema model does not express arbitrary CHECK predicates. Preserve them when editing or regenerating migrations.

## Seed data

`prisma/seed.ts` creates 30 fictional profile owners with age, placeholder photo URL, short bio, city, and normalized interests. It creates eight incoming LIKE Swipe rows targeting the demo user. Seeding is idempotent: stable user/profile IDs and compound upserts prevent duplicate rows; only interest links for seeded profiles are rebuilt.
