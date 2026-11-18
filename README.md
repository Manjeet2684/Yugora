<div align="center">
  <img src="docs/assets/yugora-cover.svg" alt="YUGORA — Two sides. One genuine connection." width="100%" />
  <br />
  <a href="https://github.com/Manjeet2684/Yugora/actions/workflows/architecture-check.yml"><img alt="Quality gates" src="https://github.com/Manjeet2684/Yugora/actions/workflows/architecture-check.yml/badge.svg" /></a>
  <img alt="Node.js 22" src="https://img.shields.io/badge/Node.js-22-356f43?logo=nodedotjs&logoColor=white" />
  <img alt="Prisma 7" src="https://img.shields.io/badge/Prisma-7.10.1-2d3748?logo=prisma&logoColor=white" />
  <img alt="SQLite" src="https://img.shields.io/badge/Database-SQLite-07405e?logo=sqlite&logoColor=white" />
  <img alt="Copyright all rights reserved" src="https://img.shields.io/badge/Project%20license-All%20rights%20reserved-8b5e3c" />
</div>

<h3 align="center">A connection, only when it's mutual.</h3>

<p align="center">
  YUGORA is a privacy-first, swipe-based social discovery application.<br />
  Interest can be expressed privately. A connection becomes visible only when both people choose it.
</p>

<p align="center">
  <a href="#product-principle">Product</a> ·
  <a href="#system-architecture">Architecture</a> ·
  <a href="#database-design">ER diagram</a> ·
  <a href="#getting-started">Run locally</a> ·
  <a href="#codebase-map">Codebase</a> ·
  <a href="COPYRIGHT.md">Copyright</a>
</p>

---

## Product principle

YUGORA is built around one rule: **a match is mutual or it is not a match.** One-sided interest is private and does not change feed eligibility.

| User action | What gets persisted | What the other person can see |
|---|---|---|
| A likes B | Directed `Swipe(A → B, LIKE)` | Nothing about A's one-sided interest |
| A passes B | Directed `Swipe(A → B, PASS)` | Nothing |
| B also likes A | A second directed LIKE and one canonical `Match(A, B)` | The confirmed mutual match |

<img src="docs/assets/matching-flow.svg" alt="YUGORA mutual-only matching flow" width="100%" />

### Assignment scope

This is a standalone implementation of the Coy SDE Intern assignment. It has a blank **Home** tab and a functional **Discover** experience in the planned UI gate. The assignment asks for 30+ mock profiles, pre-seeded incoming likes, swipe decisions that survive reloads, mutual-only matches, and these backend operations:

| Method | Route | Contract |
|---|---|---|
| `GET` | `/feed` | Profiles the current user has not swiped on |
| `POST` | `/swipe` | Persist `LIKE` or `PASS`; return whether a mutual match was created |
| `GET` | `/matches` | Return only persisted mutual matches |

> No Coy production code, user data, or private service is included. All seed profiles are fictional demo fixtures.

## Delivery roadmap

| Gate | Deliverable | Status |
|---|---|---|
| **1 · Architecture** | Domain entities, policies, use cases, ports, API contracts, ADRs, architecture tests | <img alt="Complete" src="https://img.shields.io/badge/complete-1b7a52" /> |
| **2 · Persistence** | Prisma 7, SQLite schema/migrations, repositories, transactional Unit of Work, 30 profiles, 8 incoming demo likes, mutual-match database triggers, real-database tests | <img alt="Complete" src="https://img.shields.io/badge/complete-1b7a52" /> |
| **3 · Backend** | Root-path Next.js Route Handlers, strict JSON validation, safe error mapping, private/no-store responses, real-SQLite HTTP integration tests | <img alt="Complete" src="https://img.shields.io/badge/complete-1b7a52" /> |
| **4 · Frontend** | Mobile-first Discover, drag gestures, Like/Pass controls, match moment, Matches view, empty/error states | <img alt="Planned" src="https://img.shields.io/badge/planned-64748b" /> |
| **5 · Quality** | E2E, concurrency/privacy regression, responsive and accessibility verification, final demo docs | <img alt="Planned" src="https://img.shields.io/badge/planned-64748b" /> |

Gates 1, 2 and 3 are complete and committed. Domain/application logic, Prisma/SQLite persistence, and the three required HTTP operations are covered by automated tests. The frontend remains Gate 4.

## System architecture

<img src="docs/assets/architecture.svg" alt="YUGORA hexagonal architecture from inbound adapters through application and domain contracts to Prisma repositories and SQLite" width="100%" />

YUGORA follows **Hexagonal Architecture (Ports and Adapters)**. The domain owns the matching rule. The application layer coordinates use cases. Infrastructure implements outbound ports. Database, HTTP, and UI details do not become business logic.

<details>
  <summary><strong>Open the architecture diagram source (Mermaid)</strong></summary>

  ```mermaid
  flowchart LR
    UI[Inbound UI adapter<br/>Gate 4] --> HTTP[HTTP Route Handlers<br/>Gate 3]
    HTTP --> APP[Application Use Cases<br/>Gate 1]
    APP --> DOMAIN[Domain Entities & Policies<br/>Gate 1]
    APP --> PORTS[Outbound Repository Ports<br/>Gate 1]
    PORTS -. implemented by .-> ADAPTERS[Prisma Repositories<br/>Gate 2]
    ADAPTERS --> DB[(SQLite)]
  ```
  Editable source: [`docs/diagrams/architecture.mmd`](docs/diagrams/architecture.mmd).
</details>

### Transaction boundary

`RecordSwipeUseCase` invokes `UnitOfWorkPort`. `PrismaUnitOfWork` provides one interactive Prisma transaction to the Profile, Swipe, and Match repositories. The outgoing decision, reciprocal LIKE lookup, and canonical Match insert commit or roll back together.

## Database design

<img src="docs/assets/er-diagram.svg" alt="YUGORA ER diagram showing User, Profile, Interest, ProfileInterest, Swipe, and Match" width="100%" />

<details>
  <summary><strong>Open the ER diagram source (Mermaid)</strong></summary>

  ```mermaid
  erDiagram
    USER ||--o| PROFILE : owns
    PROFILE ||--o{ PROFILE_INTEREST : has
    INTEREST ||--o{ PROFILE_INTEREST : labels
    USER ||--o{ SWIPE : actor
    USER ||--o{ SWIPE : target
    USER ||--o{ MATCH : low_participant
    USER ||--o{ MATCH : high_participant

    USER {
      string id PK
      datetime createdAt
    }
    PROFILE {
      string id PK
      string ownerUserId FK,UK
      string name
      int age
      string photoUrl
      string bio
      string locationLabel
      boolean isActive
      int displayOrder
    }
    INTEREST {
      string id PK
      string name UK
    }
    PROFILE_INTEREST {
      string profileId PK,FK
      string interestId PK,FK
      int position
    }
    SWIPE {
      string id PK
      string actorUserId FK
      string targetUserId FK
      string direction
      datetime createdAt
    }
    MATCH {
      string id PK
      string userLowId FK
      string userHighId FK
      datetime matchedAt
    }
  ```
  Editable source: [`docs/diagrams/erd.mmd`](docs/diagrams/erd.mmd).
</details>

### Why there is no `IncomingLike` table

Every decision is stored exactly once as a directed Swipe. An incoming LIKE for the demo user is simply a Swipe whose `targetUserId` is the demo user. The feed query filters on decisions **made by the viewer**, not decisions received by the viewer. The response DTO only includes public profile fields.

| Integrity rule | Enforcement |
|---|---|
| One decision per directed pair | `UNIQUE(actorUserId, targetUserId)` |
| No self-swipe | SQLite `CHECK(actorUserId <> targetUserId)` |
| Only `LIKE` or `PASS` | SQLite `CHECK(direction IN ('LIKE', 'PASS'))` |
| Adult-only mock profiles | SQLite `CHECK(age >= 18)` |
| One profile per owner | `UNIQUE(Profile.ownerUserId)` |
| One match per unordered pair | Canonical pair + unique `(userLowId, userHighId)` |
| Canonical match order | SQLite `CHECK(userLowId < userHighId)` |
| Match requires two reciprocal LIKEs | Repository guard + SQLite insert/update triggers |
| Persisted Swipe decision cannot be changed | SQLite immutability trigger |
| Removing a supporting Swipe cannot leave a stale Match | SQLite delete trigger removes that pair's Match |
| Profile-interest many-to-many | Composite primary key `(profileId, interestId)` |

> SQLite CHECK predicates are authored in the SQL migration because arbitrary CHECK constraints are not represented in the Prisma schema DSL. Preserve these constraints when evolving migrations. See [`docs/architecture/data-model.md`](docs/architecture/data-model.md).

## Technology choices

| Area | Choice | Responsibility |
|---|---|---|
| Web/API framework | Next.js 16.4.6 App Router | Node.js Route Handlers and service shell |
| UI runtime | React 19.3.1 | Server-rendered service landing page; interactive Discover is Gate 4 |
| Language | TypeScript, Node.js 22 | Strict types and runtime |
| ORM | Prisma ORM 7.10.1 | Typed data access and migrations |
| Database | SQLite | Durable local source of truth |
| SQLite driver | `better-sqlite3` via Prisma adapter | SQLite connection and transactions |
| Tests | Node test runner | Domain, application, persistence integration |
| Architecture | Hexagonal / Ports and Adapters | Framework-independent core |

## Getting started

**Requirements:** Node.js 22.12+ and npm. The current-user adapter follows the assignment's explicit assumption of one already-logged-in demo user and no external authentication; it is not production authentication. `better-sqlite3` uses a native Node add-on; use a supported Node version for your platform.

```bash
# 1. Clone the repository
git clone https://github.com/Manjeet2684/Yugora.git
cd Yugora

# 2. Configure the local database and demo identity
cp .env.example .env

# 3. Install packages and generate the Prisma Client
npm ci

# 4. Apply the committed migration and seed the demo data
npm run db:deploy
npm run db:seed

# 5. Run schema, type, architecture and real-SQLite checks
npm run check
```

The seed command is designed to be repeatable. It creates 30 fictional profiles and eight incoming LIKE decisions targeting the demo user. Re-running it will not duplicate users, profiles, tags, or directed swipes.

### Useful database commands

| Command | Purpose |
|---|---|
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:generate` | Regenerate the Prisma Client |
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:deploy` | Apply committed migrations |
| `npm run db:seed` | Seed or reconcile the demo fixtures |
| `npm run db:reset` | Destructively reset the local database and reseed |
| `npm run db:studio` | Open Prisma Studio |

`db:reset` is destructive. It should only be run against a disposable local assignment database.

## API behaviour and privacy contract

The Gate 3 Next.js App Router-compatible Route Handlers are implemented at `app/feed/route.ts`, `app/swipe/route.ts`, and `app/matches/route.ts`. The transport adapter is framework-independent and is tested directly against real SQLite. The Next.js service is runnable; the interactive Discover experience and Matches UI remain Gate 4. The persistence layer must support the following behaviour:

- `GET /feed` excludes all profiles previously swiped on by the demo user, whether the decision was LIKE or PASS.
- A profile's incoming LIKE does not remove it from the demo user's feed and is not serialized in the profile DTO.
- `POST /swipe` is idempotent for the same directed decision and rejects an incompatible second decision.
- A match is inserted only when two reciprocal LIKE decisions exist. The repository checks both rows and SQLite triggers independently reject invalid matches.
- `GET /matches` reads the persisted Match table only; no match is inferred from one-sided interest.

## Codebase map

<details open>
  <summary><strong>Expand the project structure</strong></summary>

  ```text
  Yugora/
  ├── app/                         # Next.js service page and root-path API handlers
  │   ├── feed/route.ts            # GET /feed
  │   ├── swipe/route.ts           # POST /swipe
  │   ├── matches/route.ts         # GET /matches
  │   ├── layout.tsx               # Root document and metadata
  │   ├── page.tsx                 # Minimal service landing page
  │   └── globals.css              # Service shell styles
  ├── prisma/
  │   ├── migrations/                 # Versioned SQLite DDL
  │   ├── schema.prisma               # Six normalized models
  │   └── seed.ts                     # 30 fictional profiles + incoming likes
  ├── src/
  │   ├── modules/discovery/
  │   │   ├── domain/                  # Entities, identifiers, mutual-like policy
  │   │   ├── application/             # Ports, use cases, DTOs and errors
  │   │   └── infrastructure/
  │   │       └── persistence/prisma/  # Profile, Swipe, Match, Unit of Work adapters
  │   ├── modules/discovery/http/      # Transport validation and error mapping
  │   └── infrastructure/
  │       ├── database/                # Prisma client and demo-user adapter
  │       └── http/                    # Warm-process route application singleton
  │   └── shared/contracts/            # Transport-neutral API contracts
  ├── next.config.ts               # Node.js native SQLite adapter externalization
  ├── tests/
  │   ├── architecture.test.mjs       # In-memory core tests
  │   ├── persistence.integration.test.mjs
  │   └── http.integration.test.mjs   # Real-SQLite HTTP adapter tests
  ├── docs/
  │   ├── assets/                     # README visuals, ERD and architecture
  │   ├── diagrams/                   # Editable Mermaid diagram source
  │   └── architecture/               # Design decisions and data-model notes
  ├── COPYRIGHT.md
  └── README.md
  ```
</details>

### Important source files

- [Domain matching policy](src/modules/discovery/domain/policies/mutual-match-policy.ts)
- [RecordSwipe use case](src/modules/discovery/application/use-cases/record-swipe.use-case.ts)
- [Profile repository port](src/modules/discovery/application/ports/profile-repository.port.ts)
- [Prisma Profile adapter](src/modules/discovery/infrastructure/persistence/prisma/prisma-profile.repository.ts)
- [Prisma Swipe adapter](src/modules/discovery/infrastructure/persistence/prisma/prisma-swipe.repository.ts)
- [Prisma Match adapter](src/modules/discovery/infrastructure/persistence/prisma/prisma-match.repository.ts)
- [Prisma Unit of Work](src/modules/discovery/infrastructure/persistence/prisma/prisma-unit-of-work.ts)
- [Prisma schema](prisma/schema.prisma)
- [Initial migration](prisma/migrations/20261118000000_init/migration.sql)
- [Mutual-match integrity migration](prisma/migrations/20261118010000_enforce_mutual_match_integrity/migration.sql)
- [Match invariant error](src/modules/discovery/application/errors/application-errors.ts)
- [HTTP route adapter](src/modules/discovery/http/discovery-route-handlers.ts)
- [GET /feed](app/feed/route.ts) · [POST /swipe](app/swipe/route.ts) · [GET /matches](app/matches/route.ts)
- [ADR-004: mutual-match persistence invariant](docs/architecture/decisions/ADR-004-mutual-match-database-invariant.md)
- [Deterministic seed](prisma/seed.ts)

## Quality gates

Every push and pull request runs the GitHub Actions workflow. It validates the Prisma schema, type-checks the code, runs the Gate 1 architecture suite, deploys the SQLite migration into an ephemeral CI database, runs the seed twice, and executes real-database adapter tests.

The architecture suite uses in-memory fakes to verify business rules. The persistence suite uses a real SQLite file through Prisma to verify repository queries, uniqueness/upsert behaviour, feed privacy, transaction rollback, and mutual-match triggers. It includes checks that direct invalid Match inserts are rejected and that deleting a supporting LIKE removes the Match. CI installs from the committed npm lockfile and runs `npm audit --audit-level=high` before tests. HTTP handlers are covered by a real-SQLite integration suite in Gate 3. Browser acceptance tests are added in Gates 4–5.

## Copyright and attribution

**YUGORA original project work — Copyright © 2026 Manjeet2684. All rights reserved.** This repository is public for review and portfolio evaluation; public visibility does not grant permission to reuse the original code, schema, diagrams, documentation, or visual assets. Third-party packages and externally hosted placeholder photos remain under their respective owners' licences and terms. See [`COPYRIGHT.md`](COPYRIGHT.md) and [`LICENSE`](LICENSE).

---

<p align="center"><strong>YUGORA</strong><br /><em>Two sides. One genuine connection.</em><br /><sub>Built with care for mutuality, privacy, and sound engineering.</sub></p>