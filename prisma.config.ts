// Copyright (c) 2026 Manjeet2684. All rights reserved.
import "dotenv/config";
import { defineConfig } from "prisma/config";

const LOCAL_POSTGRES_URL =
  "postgresql://yugora:yugora@127.0.0.1:5432/yugora?schema=public";

type MigrationEnvironment = Readonly<Record<string, string | undefined>>;

/**
 * Neon/Vercel exposes DATABASE_URL_UNPOOLED for direct Prisma CLI operations.
 * DIRECT_URL remains as a backwards-compatible alias for existing deployments.
 * The application runtime continues to use pooled DATABASE_URL in prisma-client.ts.
 */
export function resolveMigrationDatabaseUrl(
  environment: MigrationEnvironment = process.env,
): string {
  return (
    environment.DATABASE_URL_UNPOOLED ??
    environment.DIRECT_URL ??
    environment.DATABASE_URL ??
    LOCAL_POSTGRES_URL
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI commands (migrate/seed) should use the direct, unpooled URL.
    url: resolveMigrationDatabaseUrl(),
  },
});
