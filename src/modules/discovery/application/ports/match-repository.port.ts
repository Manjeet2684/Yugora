import type { Match } from "../../domain/entities/match.js";
import type { UserId } from "../../domain/values/identifiers.js";

export interface CreateMatchResult {
  readonly match: Match;
  readonly created: boolean;
}

export interface MatchRepositoryPort {
  findBetween(firstUserId: UserId, secondUserId: UserId): Promise<Match | null>;
  createIfAbsent(match: Match): Promise<CreateMatchResult>;
  listForUser(userId: UserId): Promise<readonly Match[]>;
}
