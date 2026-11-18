// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { CreateMatchResult, MatchRepositoryPort } from "../../../application/ports/match-repository.port.js";
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
