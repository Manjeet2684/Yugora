// Copyright (c) 2026 Manjeet2684. All rights reserved.
import { randomUUID } from "node:crypto";
import type { CurrentUserPort } from "../../../application/ports/current-user.port.js";
import { createDiscoveryApplication } from "../../composition/discovery.container.js";
import { PrismaMatchRepository } from "./prisma-match.repository.js";
import { PrismaProfileRepository } from "./prisma-profile.repository.js";
import { PrismaUnitOfWork } from "./prisma-unit-of-work.js";
import type { PrismaClient } from "../../../../../generated/prisma/client.js";

export function createPrismaDiscoveryApplication(input: {
  readonly prisma: PrismaClient;
  readonly currentUser: CurrentUserPort;
}) {
  const profiles = new PrismaProfileRepository(input.prisma);
  const matches = new PrismaMatchRepository(input.prisma);
  return createDiscoveryApplication({
    currentUser: input.currentUser,
    profiles,
    matches,
    unitOfWork: new PrismaUnitOfWork(input.prisma),
    createId: randomUUID,
  });
}
