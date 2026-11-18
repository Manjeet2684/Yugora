// Copyright (c) 2026 Manjeet2684. All rights reserved.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const NOTICE = "Copyright (c) 2026 Manjeet2684";
const ROOT = process.cwd();
const SOURCE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".mjs", ".sql", ".css", ".svg", ".mmd", ".yml", ".yaml", ".prisma",
]);
const SCAN_ROOTS = ["app", "src", "prisma", "tests", "docs", ".github"];
const EXPLICIT_ROOT_FILES = [".env.example", "next.config.ts", "playwright.config.mjs", "prisma.config.ts"];

async function collectSourceFiles(relativeDirectory) {
  const absoluteDirectory = path.join(ROOT, relativeDirectory);
  let entries;
  try {
    entries = await readdir(absoluteDirectory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      if (relativePath === "src/generated/prisma") continue;
      files.push(...await collectSourceFiles(relativePath));
      continue;
    }
    if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(relativePath);
    }
  }
  return files;
}

test("all first-party source, migration, test, diagram and asset files carry the YUGORA copyright notice", async () => {
  const discovered = (await Promise.all(SCAN_ROOTS.map(collectSourceFiles))).flat();
  const files = [...new Set([...discovered, ...EXPLICIT_ROOT_FILES])].sort();
  const missing = [];

  for (const relativePath of files) {
    const content = await readFile(path.join(ROOT, relativePath), "utf8");
    if (!content.slice(0, 512).includes(NOTICE)) missing.push(relativePath);
  }

  assert.deepEqual(missing, [], "Missing copyright headers: " + missing.join(", "));
  assert.ok(files.length >= 50, "The copyright guard should scan the expected project source surface.");
});

test("npm package metadata identifies the project author in both manifest and lockfile", async () => {
  const [manifest, lock] = await Promise.all([
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "package-lock.json"), "utf8").then(JSON.parse),
  ]);
  assert.equal(manifest.author, "Manjeet2684");
  assert.equal(lock.packages[""].author, "Manjeet2684");
});
