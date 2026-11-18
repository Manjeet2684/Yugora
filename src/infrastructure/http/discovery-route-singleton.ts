// Copyright (c) 2026 Manjeet2684. All rights reserved.
import { createPersistentDiscoveryApplication } from "../database/prisma-discovery.application.js";
import { createDiscoveryHttpHandlers } from "../../modules/discovery/http/discovery-route-handlers.js";

const globalForYugora = globalThis as typeof globalThis & {
  __yugoraDiscoveryHttpHandlers?: ReturnType<typeof createDiscoveryHttpHandlers>;
};

/** Reuse the Prisma client and application across warm Node.js route invocations. */
export function getDiscoveryHttpHandlers() {
  if (!globalForYugora.__yugoraDiscoveryHttpHandlers) {
    const application = createPersistentDiscoveryApplication();
    globalForYugora.__yugoraDiscoveryHttpHandlers = createDiscoveryHttpHandlers(application);
  }
  return globalForYugora.__yugoraDiscoveryHttpHandlers;
}
