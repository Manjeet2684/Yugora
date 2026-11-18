// Copyright (c) 2026 Manjeet2684. All rights reserved.
import { readFile, writeFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const lockPath = new URL("../package-lock.json", import.meta.url);
const lock = JSON.parse(await readFile(lockPath, "utf8"));

if (!manifest.author || !lock.packages?.[""]) {
  throw new Error("Package metadata is incomplete; cannot preserve author provenance.");
}

lock.packages[""].author = manifest.author;
await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
