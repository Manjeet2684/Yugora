import type { SwipeDecision } from "../../domain/entities/swipe-decision.js";
import type { UserId } from "../../domain/values/identifiers.js";

export interface RecordSwipeIfAbsentResult {
  readonly decision: SwipeDecision;
  readonly created: boolean;
}

export interface SwipeRepositoryPort {
  findDecision(actorUserId: UserId, targetUserId: UserId): Promise<SwipeDecision | null>;
  /**
   * Atomically inserts only when the directed participant pair has no decision.
   * On a uniqueness race, adapters return the already-persisted decision.
   */
  createIfAbsent(decision: SwipeDecision): Promise<RecordSwipeIfAbsentResult>;
}
