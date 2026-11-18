// Copyright (c) 2026 Manjeet2684. All rights reserved.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

/**
 * Create an independently managed Prisma client for managed PostgreSQL.
 * A missing or non-PostgreSQL URL is rejected rather than silently falling back
 * to an instance-local database that would lose writes on serverless platforms.
 */
export function createPrismaClient(
  databaseUrl: string | undefined = process.env.DATABASE_URL,
): PrismaClient {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be configured for PostgreSQL.");
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the postgres:// or postgresql:// protocol.");
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}
