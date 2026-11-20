// Copyright (c) 2026 Manjeet2684. All rights reserved.
import { createMatch } from "../../domain/entities/match.js";
import { createSwipeDecision, type SwipeDirection } from "../../domain/entities/swipe-decision.js";
import { isMutualLike } from "../../domain/policies/mutual-match-policy.js";
import { asMatchId, asSwipeId, type ProfileId } from "../../domain/values/identifiers.js";
import type { CurrentUserPort } from "../ports/current-user.port.js";
import type { UnitOfWorkPort } from "../ports/unit-of-work.port.js";
import { InvalidSwipeCommandError, ProfileNotFoundError, SwipeConflictError } from "../errors/application-errors.js";
import { toMatchDto } from "../dto/discovery-dto.js";
import { noMatchResult, type SwipeResult } from "../dto/swipe-result.js";

export interface RecordSwipeCommand {
  readonly profileId: ProfileId;
  readonly direction: SwipeDirection;
}

export class RecordSwipeUseCase {
  constructor(
    private readonly currentUser: CurrentUserPort,
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly createId: () => string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(command: RecordSwipeCommand): Promise<SwipeResult> {
    if (!command.profileId || !["LIKE", "PASS"].includes(command.direction)) {
      throw new InvalidSwipeCommandError();
    }

    const actorUserId = await this.currentUser.getCurrentUserId();

    return this.unitOfWork.execute(async ({ profiles, swipes, matches, lockPair }) => {
      const profile = await profiles.findActiveById(command.profileId);
      if (!profile) throw new ProfileNotFoundError();
      if (profile.ownerUserId === actorUserId) {
        throw new InvalidSwipeCommandError("You cannot swipe on your own profile.");
      }

      // Opposite-direction swipes for the same pair must serialize. Without a
      // transaction-scoped pair lock, two simultaneous reciprocal LIKEs can
      // each commit after observing the other's uncommitted swipe and neither
      // request creates the mutual Match.
      await lockPair(actorUserId, profile.ownerUserId);

      const existing = await swipes.findDecision(actorUserId, profile.ownerUserId);
      if (existing && existing.direction !== command.direction) {
        throw new SwipeConflictError();
      }

      // An identical retry is safe. It also reconciles a reciprocal LIKE if one
      // was added by another participant between the original request and retry.
      let outgoing = existing ?? createSwipeDecision({
        id: asSwipeId(this.createId()),
        actorUserId,
        targetUserId: profile.ownerUserId,
        direction: command.direction,
        createdAt: this.now(),
      });

      if (!existing) {
        const persisted = await swipes.createIfAbsent(outgoing);
        if (persisted.decision.direction !== command.direction) {
          throw new SwipeConflictError();
        }
        // Use the database's canonical record after a concurrent identical request.
        // Rebind to the stored record so subsequent policy checks use persisted facts.
        outgoing = persisted.decision;
      }
      if (outgoing.direction === "PASS") return noMatchResult();

      const reciprocal = await swipes.findDecision(profile.ownerUserId, actorUserId);
      if (!isMutualLike(outgoing, reciprocal)) return noMatchResult();

      const match = createMatch({
        id: asMatchId(this.createId()),
        participantA: actorUserId,
        participantB: profile.ownerUserId,
        matchedAt: this.now(),
      });
      const persisted = await matches.createIfAbsent(match);

      return {
        success: true,
        matched: true,
        matchCreated: persisted.created,
        match: toMatchDto(persisted.match, actorUserId, profile),
      };
    });
  }
}
