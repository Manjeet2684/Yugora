// Copyright (c) 2026 Manjeet2684. All rights reserved.
import { createMatch } from "../../../domain/entities/match.js";
import { createSwipeDecision, SWIPE_DIRECTIONS, type SwipeDirection } from "../../../domain/entities/swipe-decision.js";
import type { Profile } from "../../../domain/entities/profile.js";
import type { Match } from "../../../domain/entities/match.js";
import type { SwipeDecision } from "../../../domain/entities/swipe-decision.js";
import { asMatchId, asProfileId, asSwipeId, asUserId } from "../../../domain/values/identifiers.js";
import type { ProfileWithInterests } from "./prisma-types.js";

export function toDomainProfile(row: ProfileWithInterests): Profile {
  return {
    id: asProfileId(row.id),
    ownerUserId: asUserId(row.ownerUserId),
    name: row.name,
    age: row.age,
    photoUrl: row.photoUrl,
    bio: row.bio,
    locationLabel: row.locationLabel,
    interests: row.interests.map((item) => item.interest.name),
    isActive: row.isActive,
    displayOrder: row.displayOrder,
  };
}

export function toDomainSwipe(row: {
  id: string;
  actorUserId: string;
  targetUserId: string;
  direction: string;
  createdAt: Date;
}): SwipeDecision {
  if (!SWIPE_DIRECTIONS.includes(row.direction as SwipeDirection)) {
    throw new Error(`Persisted swipe direction is invalid: ${row.direction}`);
  }
  return createSwipeDecision({
    id: asSwipeId(row.id),
    actorUserId: asUserId(row.actorUserId),
    targetUserId: asUserId(row.targetUserId),
    direction: row.direction as SwipeDirection,
    createdAt: row.createdAt,
  });
}

export function toDomainMatch(row: {
  id: string;
  userLowId: string;
  userHighId: string;
  matchedAt: Date;
}): Match {
  return createMatch({
    id: asMatchId(row.id),
    participantA: asUserId(row.userLowId),
    participantB: asUserId(row.userHighId),
    matchedAt: row.matchedAt,
  });
}
