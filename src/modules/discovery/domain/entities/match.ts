// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { MatchId, UserId } from "../values/identifiers.js";

/** A match stores its participant pair in a stable, order-independent form. */
export interface Match {
  readonly id: MatchId;
  readonly userLowId: UserId;
  readonly userHighId: UserId;
  readonly matchedAt: Date;
}

const UTF8_ENCODER = new TextEncoder();

/**
 * PostgreSQL COLLATE "C" compares UTF-8 byte sequences. Match ordering in the
 * domain must use the same comparison instead of JavaScript's UTF-16 ordering,
 * otherwise some valid non-ASCII IDs can violate the database CHECK constraint.
 */
export function compareUserIdsForStorage(first: UserId, second: UserId): number {
  const firstBytes = UTF8_ENCODER.encode(first);
  const secondBytes = UTF8_ENCODER.encode(second);
  const commonLength = Math.min(firstBytes.length, secondBytes.length);

  for (let index = 0; index < commonLength; index += 1) {
    const firstByte = firstBytes[index] ?? 0;
    const secondByte = secondBytes[index] ?? 0;
    if (firstByte !== secondByte) return firstByte - secondByte;
  }

  return firstBytes.length - secondBytes.length;
}

export function canonicalizeParticipants(
  first: UserId,
  second: UserId,
): readonly [UserId, UserId] {
  if (first === second) {
    throw new Error("A user cannot match with themselves.");
  }
  return compareUserIdsForStorage(first, second) < 0
    ? [first, second]
    : [second, first];
}

export function createMatch(input: {
  readonly id: MatchId;
  readonly participantA: UserId;
  readonly participantB: UserId;
  readonly matchedAt: Date;
}): Match {
  if (!(input.matchedAt instanceof Date) || Number.isNaN(input.matchedAt.getTime())) {
    throw new Error("Match creation time must be a valid date.");
  }
  const [userLowId, userHighId] = canonicalizeParticipants(
    input.participantA,
    input.participantB,
  );
  return Object.freeze({
    id: input.id,
    userLowId,
    userHighId,
    matchedAt: new Date(input.matchedAt),
  });
}

export function otherParticipant(match: Match, currentUserId: UserId): UserId {
  if (match.userLowId === currentUserId) return match.userHighId;
  if (match.userHighId === currentUserId) return match.userLowId;
  throw new Error("The requested user is not a participant in this match.");
}
