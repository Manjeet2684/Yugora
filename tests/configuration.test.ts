// Copyright (c) 2026 Manjeet2684. All rights reserved.
import assert from "node:assert/strict";
import test from "node:test";
import { resolveMigrationDatabaseUrl } from "../prisma.config.js";

const LOCAL_URL = "postgresql://yugora:yugora@127.0.0.1:5432/yugora?schema=public";

test("Prisma CLI prefers Neon's direct URL over the pooled runtime URL", () => {
  assert.equal(
    resolveMigrationDatabaseUrl({
      DATABASE_URL: "postgresql://pool.example/app",
      DATABASE_URL_UNPOOLED: "postgresql://direct.example/app",
      DIRECT_URL: "postgresql://legacy-direct.example/app",
    }),
    "postgresql://direct.example/app",
  );
});

test("Prisma CLI accepts the legacy DIRECT_URL alias when Neon variable is absent", () => {
  assert.equal(
    resolveMigrationDatabaseUrl({
      DATABASE_URL: "postgresql://pool.example/app",
      DIRECT_URL: "postgresql://legacy-direct.example/app",
    }),
    "postgresql://legacy-direct.example/app",
  );
});

test("Prisma CLI falls back to DATABASE_URL for local and CI environments", () => {
  assert.equal(
    resolveMigrationDatabaseUrl({
      DATABASE_URL: "postgresql://local.example/app",
    }),
    "postgresql://local.example/app",
  );
});

test("Prisma CLI uses the harmless local PostgreSQL default when no URL is supplied", () => {
  assert.equal(resolveMigrationDatabaseUrl({}), LOCAL_URL);
});
