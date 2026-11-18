// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { PublicProfileDto, MatchDto } from "../../modules/discovery/application/dto/discovery-dto.js";
import type { SwipeDirection } from "../../modules/discovery/domain/entities/swipe-decision.js";

export interface FeedResponse {
  readonly profiles: readonly PublicProfileDto[];
}

export interface SwipeRequest {
  readonly profileId: string;
  readonly direction: SwipeDirection;
}

export interface SwipeResponse {
  readonly success: true;
  readonly matched: boolean;
  readonly matchCreated: boolean;
  readonly match: MatchDto | null;
}

export interface MatchesResponse {
  readonly matches: readonly MatchDto[];
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly retryable: boolean;
  };
}
