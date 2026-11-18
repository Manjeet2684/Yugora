# YUGORA

**A modern, privacy-first social discovery platform where genuine connections happen only through mutual interest.**

YUGORA is built around one simple principle: a match exists only when both people independently choose to like each other. One-sided interest stays private.

> A connection, only when it's mutual.

## Assignment scope

The application has two tabs: a placeholder Home tab and a functional Discover experience.

Required backend operations:
- GET /feed — return profiles the demo user has not decided on.
- POST /swipe — record a LIKE or PASS; report a match only after reciprocal LIKE.
- GET /matches — return confirmed mutual matches only.

The assignment requires at least 30 mock profiles, durable swipe decisions, no repeat profiles after a decision, and privacy for non-mutual incoming interest.

## Product invariants

1. A profile the demo user has swiped on never reappears in the feed.
2. Incoming one-sided interest is not exposed through the feed API or UI.
3. A match requires both LIKE(A, B) and LIKE(B, A).
4. Swipe persistence and match creation are atomic.
5. The database is the source of truth; UI state is presentation state.
6. Animations do not claim success before the server confirms the operation.

## Architecture

The project follows **Hexagonal Architecture (Ports and Adapters)**. Domain and application logic depend on ports, while framework and persistence details are supplied by adapters. Business rules do not belong in HTTP route handlers or UI components.

## Delivery gates

| Gate | Scope | Status |
|---|---|---|
| 1 | Domain, ports, use cases, composition root, API contracts, ADRs, architecture tests | Implemented and verified locally |
| 2 | Prisma schema, SQLite persistence, migrations, deterministic seed data | Planned |
| 3 | HTTP route handlers, validation, transactions, privacy integration tests | Planned |
| 4 | Responsive UI, swipe gestures, motion, match experience | Planned |
| 5 | End-to-end, accessibility, responsive and regression QA | Planned |

## Repository import note

The complete Gate 1 source tree is supplied separately as yugora-gate1.zip in this project handoff. Download that archive into the repository root and extract it there, not into a nested folder:

    unzip -o yugora-gate1.zip -d .
    npm install
    npm run check

The repository currently contains the project overview and architecture documentation; the Gate 1 source archive is the authoritative source package until its contents are expanded into tracked paths.

## Gate 1 verification

The source package was checked locally with strict TypeScript type-checking and the Node architecture test suite: **14 tests passed, 0 failed**. Tests use in-memory adapters and do not claim to verify a real SQLite database, HTTP server, browser UI, or animations. Those are later-gate responsibilities.

YUGORA — **Two sides. One genuine connection.**
