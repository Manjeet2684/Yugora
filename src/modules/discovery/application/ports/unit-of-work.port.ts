// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { ProfileRepositoryPort } from "./profile-repository.port.js";
import type { SwipeRepositoryPort } from "./swipe-repository.port.js";
import type { MatchRepositoryPort } from "./match-repository.port.js";

export interface DiscoveryTransactionRepositories {
  readonly profiles: ProfileRepositoryPort;
  readonly swipes: SwipeRepositoryPort;
  readonly matches: MatchRepositoryPort;
}

/** Executes all callback operations in one atomic persistence transaction. */
export interface UnitOfWorkPort {
  execute<T>(
    operation: (repositories: DiscoveryTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
