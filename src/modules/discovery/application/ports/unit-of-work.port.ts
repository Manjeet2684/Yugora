// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { ProfileRepositoryPort } from "./profile-repository.port.js";
import type { SwipeRepositoryPort } from "./swipe-repository.port.js";
import type { MatchRepositoryPort } from "./match-repository.port.js";
import type { UserId } from "../../domain/values/identifiers.js";

export interface DiscoveryTransactionRepositories {
  readonly profiles: ProfileRepositoryPort;
  readonly swipes: SwipeRepositoryPort;
  readonly matches: MatchRepositoryPort;
  /**
   * Serialize decisions for the same unordered user pair within this transaction.
   * The adapter must release the lock automatically on commit or rollback.
   */
  lockPair(firstUserId: UserId, secondUserId: UserId): Promise<void>;
}

/** Executes all callback operations in one atomic persistence transaction. */
export interface UnitOfWorkPort {
  execute<T>(
    operation: (repositories: DiscoveryTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
