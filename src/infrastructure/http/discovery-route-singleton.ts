// Copyright (c) 2026 Manjeet2684. All rights reserved.
import { createPrismaDiscoveryApplication } from "../../modules/discovery/infrastructure/persistence/prisma/create-prisma-discovery-application.js";
import { createDiscoveryHttpHandlers } from "../../modules/discovery/http/discovery-route-handlers.js";
import { NeonAuthCurrentUserAdapter } from "../auth/neon-current-user.adapter.js";
import { getSharedPrismaClient } from "../auth/neon-auth-context.js";

/** Build a request-scoped identity adapter over the process-wide Prisma pool. */
export function getDiscoveryHttpHandlers(request: Request) {
  const prisma = getSharedPrismaClient();
  const application = createPrismaDiscoveryApplication({
    prisma,
    currentUser: new NeonAuthCurrentUserAdapter(prisma, request),
  });
  return createDiscoveryHttpHandlers(application);
}
