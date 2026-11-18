// Copyright (c) 2026 Manjeet2684. All rights reserved.
import { EnvironmentCurrentUserAdapter } from "./environment-current-user.adapter.js";
import { createPrismaClient } from "./prisma-client.js";
import { createPrismaDiscoveryApplication } from "../../modules/discovery/infrastructure/persistence/prisma/create-prisma-discovery-application.js";

/** Server composition for the assignment's single demo user. */
export function createPersistentDiscoveryApplication() {
  const prisma = createPrismaClient();
  const application = createPrismaDiscoveryApplication({
    prisma,
    currentUser: new EnvironmentCurrentUserAdapter(),
  });
  return { prisma, ...application };
}
