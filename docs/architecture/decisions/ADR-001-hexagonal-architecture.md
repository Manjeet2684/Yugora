# ADR-001: Hexagonal Architecture

**Status:** Accepted

## Context

The assignment combines discovery behavior, matching rules, HTTP operations, and persistent storage. Mixing these concerns would make privacy and transactional rules difficult to test independently.

## Decision

Use Hexagonal Architecture (Ports and Adapters). The domain expresses entities and policies. The application layer coordinates use cases through ports. Infrastructure provides adapters for persistence and framework integration. UI and HTTP layers invoke use cases but do not own business decisions.

## Consequences

- Domain and application modules remain framework-independent.
- Persistence can be implemented or replaced without changing domain rules.
- Use cases can be tested with in-memory fakes.
- More explicit interfaces and composition wiring are required.
