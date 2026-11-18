// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { Profile } from "../../domain/entities/profile.js";
import type { Match } from "../../domain/entities/match.js";
import type { UserId } from "../../domain/values/identifiers.js";
import { otherParticipant } from "../../domain/entities/match.js";

/** Safe profile shape that may cross the HTTP boundary. */
export interface PublicProfileDto {
  readonly id: string;
  readonly name: string;
  readonly age: number;
  readonly photoUrl: string;
  readonly bio: string;
  readonly locationLabel: string;
  readonly interests: readonly string[];
}

export interface MatchDto {
  readonly id: string;
  readonly profile: PublicProfileDto;
  readonly matchedAt: string;
}

export function toPublicProfileDto(profile: Profile): PublicProfileDto {
  // Explicit projection prevents persistence-only fields from leaking to clients.
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    photoUrl: profile.photoUrl,
    bio: profile.bio,
    locationLabel: profile.locationLabel,
    interests: [...profile.interests],
  };
}

export function toMatchDto(
  match: Match,
  currentUserId: UserId,
  matchedProfile: Profile,
): MatchDto {
  const counterpartId = otherParticipant(match, currentUserId);
  if (matchedProfile.ownerUserId !== counterpartId) {
    throw new Error("Match profile does not belong to the other participant.");
  }
  return {
    id: match.id,
    profile: toPublicProfileDto(matchedProfile),
    matchedAt: match.matchedAt.toISOString(),
  };
}
