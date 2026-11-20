// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { ProfileRepositoryPort } from "../../../application/ports/profile-repository.port.js";
import type { Profile } from "../../../domain/entities/profile.js";
import type { ProfileId, UserId } from "../../../domain/values/identifiers.js";
import { isPublicDemoMode } from "../../../../../infrastructure/auth/demo-mode.js";
import { toDomainProfile } from "./prisma-mappers.js";
import { profileWithInterests, type PrismaExecutor } from "./prisma-types.js";

export class PrismaProfileRepository implements ProfileRepositoryPort {
  constructor(private readonly db: PrismaExecutor) {}

  async listEligibleForViewer(viewerUserId: UserId): Promise<readonly Profile[]> {
    const isSharedAssignmentViewer = isPublicDemoMode()
      && viewerUserId === (process.env.DEMO_USER_ID?.trim() || "demo-user");
    const ownerUserId = isSharedAssignmentViewer
      ? { not: viewerUserId, startsWith: "yugora-user-" }
      : { not: viewerUserId };

    const rows = await this.db.profile.findMany({
      where: {
        isActive: true,
        ownerUserId,
        owner: {
          is: {
            swipesReceived: {
              none: { actorUserId: viewerUserId },
            },
          },
        },
      },
      include: profileWithInterests,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      take: 30,
    });
    return rows.map(toDomainProfile);
  }

  async findActiveById(profileId: ProfileId): Promise<Profile | null> {
    const row = await this.db.profile.findFirst({
      where: { id: profileId, isActive: true },
      include: profileWithInterests,
    });
    return row ? toDomainProfile(row) : null;
  }

  async findByOwnerUserId(ownerUserId: UserId): Promise<Profile | null> {
    const row = await this.db.profile.findUnique({
      where: { ownerUserId },
      include: profileWithInterests,
    });
    return row ? toDomainProfile(row) : null;
  }
}
