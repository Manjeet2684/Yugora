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

test("Prisma CLI uses DATABASE_URL when no deployment environment is present", () => {
  assert.equal(
    resolveMigrationDatabaseUrl({
      DATABASE_URL: "postgresql://local.example/app",
    }),
    "postgresql://local.example/app",
  );
});

test("Prisma CLI keeps a local PostgreSQL default for local development", () => {
  assert.equal(resolveMigrationDatabaseUrl({}), LOCAL_URL);
});

test("production migrations fail closed when only the pooled runtime URL is configured", () => {
  assert.throws(
    () => resolveMigrationDatabaseUrl({
      DATABASE_URL: "postgresql://pool.example/app",
      VERCEL: "1",
    }),
    /DATABASE_URL_UNPOOLED/,
  );
});

test("production migrations reject a missing direct URL even when NODE_ENV is production", () => {
  assert.throws(
    () => resolveMigrationDatabaseUrl({
      DATABASE_URL: "postgresql://pool.example/app",
      NODE_ENV: "production",
    }),
    /DATABASE_URL_UNPOOLED/,
  );
});

import { isPublicDemoMode } from "../src/infrastructure/auth/demo-mode.js";

test("public assignment demo is enabled on an opted-in Preview deployment", () => {
  assert.equal(isPublicDemoMode({
    YUGORA_PUBLIC_DEMO_MODE: "true",
    NODE_ENV: "production",
    VERCEL_ENV: "preview",
  }), true);
});

test("public assignment demo is disabled in Production even when the flag is true", () => {
  assert.equal(isPublicDemoMode({
    YUGORA_PUBLIC_DEMO_MODE: "true",
    NODE_ENV: "production",
    VERCEL_ENV: "production",
  }), false);
});

test("public assignment demo is disabled in a production runtime outside Vercel Preview", () => {
  assert.equal(isPublicDemoMode({
    YUGORA_PUBLIC_DEMO_MODE: "true",
    NODE_ENV: "production",
  }), false);
});

test("public assignment demo can be opted into during local development", () => {
  assert.equal(isPublicDemoMode({
    YUGORA_PUBLIC_DEMO_MODE: "true",
    NODE_ENV: "development",
  }), true);
});

test("public assignment demo remains disabled unless explicitly enabled", () => {
  assert.equal(isPublicDemoMode({
    YUGORA_PUBLIC_DEMO_MODE: "false",
    NODE_ENV: "production",
    VERCEL_ENV: "preview",
  }), false);
});
