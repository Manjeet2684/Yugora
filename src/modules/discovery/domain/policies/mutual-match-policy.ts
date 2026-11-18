import type { SwipeDecision } from "../entities/swipe-decision.js";

/**
 * The single domain rule for match eligibility.
 * Direction is evaluated from each participant's perspective.
 */
export function isMutualLike(
  outgoing: SwipeDecision,
  reciprocal: SwipeDecision | null,
): boolean {
  return (
    outgoing.direction === "LIKE" &&
    reciprocal !== null &&
    reciprocal.direction === "LIKE" &&
    outgoing.actorUserId === reciprocal.targetUserId &&
    outgoing.targetUserId === reciprocal.actorUserId
  );
}
