// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { UnitOfWorkPort } from "../../../application/ports/unit-of-work.port.js";
import type { DiscoveryTransactionRepositories } from "../../../application/ports/unit-of-work.port.js";
import type { UserId } from "../../../domain/values/identifiers.js";
import { canonicalizeParticipants } from "../../../domain/entities/match.js";
import type { PrismaClient } from "../../../../../generated/prisma/client.js";
import { PrismaMatchRepository } from "./prisma-match.repository.js";
import { PrismaProfileRepository } from "./prisma-profile.repository.js";
import { PrismaSwipeRepository } from "./prisma-swipe.repository.js";

const YUGORA_ADVISORY_LOCK_NAMESPACE = 741_923;

/**
 * PostgreSQL-backed Unit of Work. Pair locks are transaction-scoped advisory
 * locks: opposite-direction swipes for one pair serialize until commit/rollback.
 * A hash collision can only serialize unrelated pairs; it cannot weaken integrity.
 */
export class PrismaUnitOfWork implements UnitOfWorkPort {
  constructor(private readonly prisma: PrismaClient) {}

  execute<T>(
    operation: (repositories: DiscoveryTransactionRepositories) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (transaction) => {
      const lockPair = async (firstUserId: UserId, secondUserId: UserId): Promise<void> => {
        const [userLowId, userHighId] = canonicalizeParticipants(firstUserId, secondUserId);
        // JSON array encoding is unambiguous and uses the same canonical order as Match rows.
        const pairKey = JSON.stringify([userLowId, userHighId]);
        await transaction.$queryRaw`SELECT public.yugora_acquire_pair_lock(
          ${YUGORA_ADVISORY_LOCK_NAMESPACE},
          hashtext(${pairKey})
        ) AS locked`;
      };

      return operation({
        profiles: new PrismaProfileRepository(transaction),
        swipes: new PrismaSwipeRepository(transaction),
        matches: new PrismaMatchRepository(transaction),
        lockPair,
      });
    });
  }
}
