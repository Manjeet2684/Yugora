// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { UnitOfWorkPort } from "../../../application/ports/unit-of-work.port.js";
import type { DiscoveryTransactionRepositories } from "../../../application/ports/unit-of-work.port.js";
import type { PrismaClient } from "../../../../../generated/prisma/client.js";
import { PrismaMatchRepository } from "./prisma-match.repository.js";
import { PrismaProfileRepository } from "./prisma-profile.repository.js";
import { PrismaSwipeRepository } from "./prisma-swipe.repository.js";

export class PrismaUnitOfWork implements UnitOfWorkPort {
  constructor(private readonly prisma: PrismaClient) {}

  execute<T>(
    operation: (repositories: DiscoveryTransactionRepositories) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (transaction) => {
      return operation({
        profiles: new PrismaProfileRepository(transaction),
        swipes: new PrismaSwipeRepository(transaction),
        matches: new PrismaMatchRepository(transaction),
      });
    });
  }
}
