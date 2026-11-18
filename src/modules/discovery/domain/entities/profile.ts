// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { ProfileId, UserId } from "../values/identifiers.js";

/**
 * Internal profile entity. It contains profile facts only; it deliberately has
 * no incoming-like, outgoing-like, or match-status properties.
 */
export interface Profile {
  readonly id: ProfileId;
  readonly ownerUserId: UserId;
  readonly name: string;
  readonly age: number;
  readonly photoUrl: string;
  readonly bio: string;
  readonly locationLabel: string;
  readonly interests: readonly string[];
  readonly isActive: boolean;
  readonly displayOrder: number;
}
