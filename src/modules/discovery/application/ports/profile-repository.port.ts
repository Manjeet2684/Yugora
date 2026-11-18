// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { Profile } from "../../domain/entities/profile.js";
import type { ProfileId, UserId } from "../../domain/values/identifiers.js";

export interface ProfileRepositoryPort {
  /**
   * Returns active profiles excluding every target already swiped on by viewer.
   * Incoming likes must not affect eligibility and must not be included in the
   * returned profile objects.
   */
  listEligibleForViewer(viewerUserId: UserId): Promise<readonly Profile[]>;

  findActiveById(profileId: ProfileId): Promise<Profile | null>;

  /** Resolves an existing match participant; inactive profiles remain resolvable. */
  findByOwnerUserId(ownerUserId: UserId): Promise<Profile | null>;
}
