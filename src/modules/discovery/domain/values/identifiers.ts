// Copyright (c) 2026 Manjeet2684. All rights reserved.
/** Branded identifiers prevent accidentally mixing profile IDs and user IDs. */
export type UserId = string & { readonly __brand: "UserId" };
export type ProfileId = string & { readonly __brand: "ProfileId" };
export type MatchId = string & { readonly __brand: "MatchId" };
export type SwipeId = string & { readonly __brand: "SwipeId" };

function requireIdentifier(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
  return normalized;
}

export function asUserId(value: string): UserId {
  return requireIdentifier(value, "User ID") as UserId;
}

export function asProfileId(value: string): ProfileId {
  return requireIdentifier(value, "Profile ID") as ProfileId;
}

export function asMatchId(value: string): MatchId {
  return requireIdentifier(value, "Match ID") as MatchId;
}

export function asSwipeId(value: string): SwipeId {
  return requireIdentifier(value, "Swipe ID") as SwipeId;
}
