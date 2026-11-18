// Copyright (c) 2026 Manjeet2684. All rights reserved.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // CI and deployed environments must provide their own managed PostgreSQL URL.
    // This local fallback is only a harmless schema-validation default.
    url: process.env.DATABASE_URL ?? "postgresql://yugora:yugora@127.0.0.1:5432/yugora?schema=public",
  },
});
