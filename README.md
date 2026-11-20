<div align="center">
  <img src="docs/assets/yugora-cover.svg" alt="YUGORA — Two sides. One genuine connection." width="100%" />
</div>

<h3 align="center">A connection, only when it's mutual.</h3>

<p align="center">A social discovery experience where interest stays private until it is returned.</p>

## About

YUGORA is a privacy-first social discovery app. People create a profile, discover others one at a time, and express interest privately. A connection appears only when both people Like each other.

The demo is seeded with 30 fictional profiles, including eight incoming Likes, so the mutual-match flow can be explored immediately.

## Features

- **Home:** intentionally blank, as specified in the assignment.
- **Profiles:** email OTP sign-in, profile setup, editable bio, location, and interests.
- **Discover:** one profile at a time, with mobile drag gestures and desktop Like/Pass controls; a profile already swiped on never reappears.
- **Private decisions:** a one-sided Like is never revealed to the other person.
- **Mutual matches:** a match is created only after both participants have persisted a Like.
- **Matches:** view confirmed mutual connections.

## Tech stack

- Next.js App Router, React and TypeScript
- Node.js route handlers
- PostgreSQL with Prisma ORM
- Neon Auth email OTP
- Playwright for browser tests

## How it works

The application keeps product rules separate from transport and persistence:

- **Domain:** directed swipe decisions and the reciprocal-Like matching rule.
- **Application:** feed, swipe and matches use cases.
- **HTTP:** validates requests and returns explicit public response DTOs.
- **Persistence:** Prisma repositories and PostgreSQL transactions enforce durable decisions and match integrity.
- **UI:** renders profiles and server-confirmed outcomes; a card advances only after a decision is saved.

<img src="docs/assets/architecture.svg" alt="YUGORA application architecture" width="100%" />

The core data model uses `User`, `Profile`, `Interest`, `ProfileInterest`, `Swipe` and `Match`. One directed `Swipe` record represents one person's decision about another; incoming interest is not exposed as a separate profile field.

<img src="docs/assets/er-diagram.svg" alt="YUGORA database entity relationship diagram" width="100%" />

## API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/feed` | Load eligible profiles |
| `POST` | `/swipe` | Save a Like or Pass and return a confirmed match when mutual |
| `GET` | `/matches` | Load mutual matches |
| `GET` / `PUT` | `/api/profile` | Load or update the signed-in user's profile |

The swipe API accepts only `profileId` and `direction`. The acting user is resolved on the server.

See the [API contract](docs/api/contracts.md) and [data model](docs/architecture/data-model.md).

## Run locally

**Requirements:** Node.js 22.12+ and PostgreSQL 16+.

1. Install dependencies: `npm ci`.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to your PostgreSQL connection URL.
4. Set `DATABASE_URL_UNPOOLED` to a direct, unpooled URL for migrations.
5. Apply the schema and load demo data:
   ```bash
   npm run db:deploy
   npm run db:seed
   ```
6. Start the app: `npm run dev`.

For real email sign-in, configure `NEON_AUTH_BASE_URL` for your Neon Auth project and add your local origin to its trusted origins. Local development without Neon Auth uses the local demo identity.

## Quality checks

```bash
npm run check
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
```

For deployment, `npm run vercel-build` applies migrations, runs the idempotent seed and builds the Next.js application.

---

<p align="center"><strong>YUGORA</strong><br/><em>Two sides. One genuine connection.</em></p>
