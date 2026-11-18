// Copyright (c) 2026 Manjeet2684. All rights reserved.
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client.js";

/** Create an independently managed Prisma client using the SQLite driver adapter. */
export function createPrismaClient(
  databaseUrl: string = process.env.DATABASE_URL ?? "file:./prisma/dev.db",
): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  return new PrismaClient({ adapter });
}
