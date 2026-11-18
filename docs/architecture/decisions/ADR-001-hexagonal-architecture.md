# ADR-001: Use Hexagonal Architecture for the Discovery Core

- **Status:** Accepted
- **Decision:** Gate 1

## Context

The assignment requires a small consumer-facing application but evaluates backend correctness, privacy edge cases, and clean tested logic. A direct coupling between route handlers, ORM models, and React components would make business behavior difficult to test and easy to duplicate.

## Decision

Use Ports and Adapters (Hexagonal Architecture). Domain rules and application use cases depend on contracts. Next.js and Prisma are outer adapters. Dependency direction points inward.

## Consequences

- Domain policy can be tested without a database or web server.
- Persistence can change without changing match rules.
- The composition root makes dependencies explicit.
- More interfaces and files are introduced than a minimal CRUD implementation; this is intentional for clear boundaries and testability.
