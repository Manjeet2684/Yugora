// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { UserId, SwipeId } from "../values/identifiers.js";

export const SWIPE_DIRECTIONS = ["LIKE", "PASS"] as const;
export type SwipeDirection = (typeof SWIPE_DIRECTIONS)[number];

export interface SwipeDecision {
  readonly id: SwipeId;
  readonly actorUserId: UserId;
  readonly targetUserId: UserId;
  readonly direction: SwipeDirection;
  readonly createdAt: Date;
}

export function createSwipeDecision(input: SwipeDecision): SwipeDecision {
  if (input.actorUserId === input.targetUserId) {
    throw new Error("A user cannot swipe on themselves.");
  }
  if (!(input.createdAt instanceof Date) || Number.isNaN(input.createdAt.getTime())) {
    throw new Error("Swipe creation time must be a valid date.");
  }
  if (!SWIPE_DIRECTIONS.includes(input.direction)) {
    throw new Error("Swipe direction must be LIKE or PASS.");
  }
  return Object.freeze({ ...input });
}
