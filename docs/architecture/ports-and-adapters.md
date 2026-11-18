# Ports and Adapters

## Inbound ports / use cases

- GetFeedUseCase: retrieve eligible public profiles.
- RecordSwipeUseCase: persist LIKE or PASS and resolve a reciprocal match.
- GetMatchesUseCase: retrieve confirmed matches only.

## Outbound ports

- CurrentUserPort: resolves the server-side demo user.
- ProfileRepositoryPort: finds profiles and returns feed candidates.
- SwipeRepositoryPort: reads reciprocal decisions and records directed swipes.
- MatchRepositoryPort: persists and queries canonical mutual matches.
- UnitOfWorkPort: groups related writes into one transaction boundary.

## Dependency direction

Use cases depend on port interfaces. Concrete database adapters implement those interfaces. HTTP route handlers translate transport input/output, while UI components display state and emit user intent. Neither layer implements matching policy.
