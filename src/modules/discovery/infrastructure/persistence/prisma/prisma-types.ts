// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { Prisma, PrismaClient } from "../../../../../generated/prisma/client.js";

/** Shared delegate surface accepted by PrismaClient and interactive transactions. */
export type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export const profileWithInterests = {
  interests: {
    include: { interest: true },
    orderBy: { position: "asc" },
  },
} satisfies Prisma.ProfileInclude;

export type ProfileWithInterests = Prisma.ProfileGetPayload<{
  include: typeof profileWithInterests;
}>;
