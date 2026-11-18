import type { MatchId, UserId } from "../values/identifiers.js";

/** A match stores its participant pair in a stable, order-independent form. */
export interface Match {
  readonly id: MatchId;
  readonly userLowId: UserId;
  readonly userHighId: UserId;
  readonly matchedAt: Date;
}

export function canonicalizeParticipants(
  first: UserId,
  second: UserId,
): readonly [UserId, UserId] {
  if (first === second) {
    throw new Error("A user cannot match with themselves.");
  }
  return first < second ? [first, second] : [second, first];
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
