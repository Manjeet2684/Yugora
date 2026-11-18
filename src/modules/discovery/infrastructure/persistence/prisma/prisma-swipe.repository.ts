// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { RecordSwipeIfAbsentResult, SwipeRepositoryPort } from "../../../application/ports/swipe-repository.port.js";
import type { SwipeDecision } from "../../../domain/entities/swipe-decision.js";
import type { UserId } from "../../../domain/values/identifiers.js";
import { toDomainSwipe } from "./prisma-mappers.js";
import type { PrismaExecutor } from "./prisma-types.js";

export class PrismaSwipeRepository implements SwipeRepositoryPort {
  constructor(private readonly db: PrismaExecutor) {}

  async findDecision(actorUserId: UserId, targetUserId: UserId): Promise<SwipeDecision | null> {
    const row = await this.db.swipe.findUnique({
      where: { actorUserId_targetUserId: { actorUserId, targetUserId } },
    });
    return row ? toDomainSwipe(row) : null;
  }

  async createIfAbsent(decision: SwipeDecision): Promise<RecordSwipeIfAbsentResult> {
    // A database upsert makes the pair uniqueness check atomic. Comparing IDs
    // reveals whether this call inserted the record or observed an existing one.
    const row = await this.db.swipe.upsert({
      where: {
        actorUserId_targetUserId: {
          actorUserId: decision.actorUserId,
          targetUserId: decision.targetUserId,
        },
      },
      update: {},
      create: {
        id: decision.id,
        actorUserId: decision.actorUserId,
        targetUserId: decision.targetUserId,
        direction: decision.direction,
        createdAt: decision.createdAt,
      },
    });
    return {
      decision: toDomainSwipe(row),
      created: row.id === decision.id,
    };
  }
}
