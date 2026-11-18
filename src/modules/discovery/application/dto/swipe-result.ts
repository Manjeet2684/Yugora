// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { MatchDto } from "./discovery-dto.js";

export interface SwipeResult {
  readonly success: true;
  readonly matched: boolean;
  /** True only when this request inserted the Match row. */
  readonly matchCreated: boolean;
  /** Never populated unless mutual interest has been confirmed. */
  readonly match: MatchDto | null;
}

export function noMatchResult(): SwipeResult {
  return {
    success: true,
    matched: false,
    matchCreated: false,
    match: null,
  };
}
