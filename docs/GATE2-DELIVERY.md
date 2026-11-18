# YUGORA — Gate 2 Persistence Delivery

> **Historical implementation note:** Gate 2 was first delivered and tested with SQLite. The current `feature/postgres-production-hardening` branch re-platforms the Prisma adapter, SQL migrations, constraints and triggers to PostgreSQL. Use `docs/GATE5-DELIVERY.md` and `docs/SECURITY-REVIEW.md` for the current branch and hosted-release state.

**Status: Implemented and verified on GitHub Actions.** Gate 2 supplies Prisma 7.10.1 with SQLite persistence, repositories, a transactional Unit of Work, deterministic mock data, and real-database integration tests.

## Delivered

- Six normalized Prisma models: `User`, `Profile`, `Interest`, `ProfileInterest`, `Swipe`, and `Match`.
- Versioned SQLite migrations with foreign keys, uniqueness, indexes, and CHECK constraints.
- Prisma 7 `prisma-client` generator and the `better-sqlite3` driver adapter.
- Profile, Swipe, and Match repositories, plus a transaction-scoped Unit of Work.
- An environment-based current-user adapter for the assignment's explicit single-logged-in-user/no-external-auth assumption. This is a demo adapter, not production authentication.
- Idempotent seed data with 30 fictional profiles, profile interests, and eight incoming LIKE Swipe rows.
- Actual SQLite integration tests for feed eligibility/privacy, seed idempotency, uniqueness, rollback, mutual matching, and database constraints.

## Mutual-match integrity remediation

A Match is valid only when both directed LIKE decisions are persisted:

`LIKE(A, B) AND LIKE(B, A)`

The rule is now defended at three boundaries:

1. **Domain/application:** `RecordSwipeUseCase` evaluates reciprocal decisions before requesting Match creation.
2. **Repository:** `PrismaMatchRepository.createIfAbsent` independently verifies both persisted LIKE rows through the supplied Prisma executor and throws `MatchInvariantViolationError` otherwise.
3. **SQLite:** migration `20261118010000_enforce_mutual_match_integrity` adds triggers that reject invalid Match inserts/participant updates, prevent changing persisted swipe decisions, and remove a Match if either supporting Swipe is deleted.

This closes the prior gap where a caller could insert a Match row directly without proving mutual interest. No `IncomingLike` table has been introduced.

## Verification

- Prisma schema validation and Client generation: passed.
- TypeScript type-check/build: passed.
- Gate 1 architecture suite: 14 passed, 0 failed.
- Seed executed twice: still 30 profiles and eight incoming demo likes, with no duplicate fixtures.
- Gate 2 SQLite integration suite: 10 passed, 0 failed.
- Direct SQLite trigger validation: invalid insert blocked, one-sided interest blocked, reciprocal LIKE accepted, swipe-decision mutation blocked, stale match removed after supporting LIKE deletion, and user cascade deletion succeeds.

The GitHub Actions run for the integrity remediation commit is linked from the repository's Actions tab.

## Deliberately deferred

- HTTP Route Handlers for `GET /feed`, `POST /swipe`, and `GET /matches` (Gate 3).
- Multi-user authentication; the assignment explicitly permits a single assumed logged-in user and no external auth.
- Next.js screens, gestures, animation, and Matches UI (Gate 4).
- Playwright, accessibility, responsive and full browser QA (Gate 5).
