// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { CreateMatchResult, MatchRepositoryPort } from "../../../application/ports/match-repository.port.js";
import { MatchInvariantViolationError } from "../../../application/errors/application-errors.js";
import { canonicalizeParticipants } from "../../../domain/entities/match.js";
import type { Match } from "../../../domain/entities/match.js";
import type { UserId } from "../../../domain/values/identifiers.js";
import { toDomainMatch } from "./prisma-mappers.js";
import type { PrismaExecutor } from "./prisma-types.js";

export class PrismaMatchRepository implements MatchRepositoryPort {
  constructor(private readonly db: PrismaExecutor) {}

  async findBetween(firstUserId: UserId, secondUserId: UserId): Promise<Match | null> {
    const [userLowId, userHighId] = canonicalizeParticipants(firstUserId, secondUserId);
    const row = await this.db.match.findUnique({
      where: { userLowId_userHighId: { userLowId, userHighId } },
    });
    return row ? toDomainMatch(row) : null;
  }

  async createIfAbsent(match: Match): Promise<CreateMatchResult> {
    // Defense in depth: never trust a caller to have checked mutual interest.
    // The repository verifies both persisted directions through the same executor
    // (the Unit of Work supplies a transaction-scoped Prisma executor).
    const [outgoing, reciprocal] = await Promise.all([
      this.db.swipe.findUnique({
        where: {
          actorUserId_targetUserId: {
            actorUserId: match.userLowId,
            targetUserId: match.userHighId,
          },
        },
        select: { direction: true },
      }),
      this.db.swipe.findUnique({
        where: {
          actorUserId_targetUserId: {
            actorUserId: match.userHighId,
            targetUserId: match.userLowId,
          },
        },
        select: { direction: true },
      }),
    ]);

    if (outgoing?.direction !== "LIKE" || reciprocal?.direction !== "LIKE") {
      throw new MatchInvariantViolationError();
    }

    const row = await this.db.match.upsert({
      where: {
        userLowId_userHighId: {
          userLowId: match.userLowId,
          userHighId: match.userHighId,
        },
      },
      update: {},
      create: {
        id: match.id,
        userLowId: match.userLowId,
        userHighId: match.userHighId,
        matchedAt: match.matchedAt,
      },
    });
    return { match: toDomainMatch(row), created: row.id === match.id };
  }

  async listForUser(userId: UserId): Promise<readonly Match[]> {
    const rows = await this.db.match.findMany({
      where: { OR: [{ userLowId: userId }, { userHighId: userId }] },
      orderBy: { matchedAt: "desc" },
    });
    return rows.map(toDomainMatch);
  }
}
