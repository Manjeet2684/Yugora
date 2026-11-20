// Copyright (c) 2026 Manjeet2684. All rights reserved.
import assert from "node:assert/strict";
import test from "node:test";
import { createPlaceholderProfilePhotoUrl } from "../src/shared/profile-placeholder-photo.js";

test("placeholder avatar is a self-contained SVG data URL", () => {
  const url = createPlaceholderProfilePhotoUrl("Riya Mehta", 1);
  assert.ok(url.startsWith("data:image/svg+xml;charset=UTF-8,"));
  assert.ok(decodeURIComponent(url.split(",", 2)[1] ?? "").includes(">RM</text>"));
  assert.equal(url.includes("https://"), false);
});

test("placeholder variants are deterministic and vary the color palette", () => {
  assert.equal(
    createPlaceholderProfilePhotoUrl("Aarav Khanna", 2),
    createPlaceholderProfilePhotoUrl("Aarav Khanna", 2),
  );
  assert.notEqual(
    createPlaceholderProfilePhotoUrl("Aarav Khanna", 2),
    createPlaceholderProfilePhotoUrl("Aarav Khanna", 3),
  );
});

test("avatar text is XML-escaped and empty names fall back safely", () => {
  const hostile = decodeURIComponent(createPlaceholderProfilePhotoUrl("<script>alert(1)</script>", 0).split(",", 2)[1] ?? "");
  assert.equal(hostile.includes("<script>"), false);
  assert.equal(hostile.includes("&lt;S"), true);
  const empty = decodeURIComponent(createPlaceholderProfilePhotoUrl("   ", Number.NaN).split(",", 2)[1] ?? "");
  assert.ok(empty.includes(">YU</text>"));
});


test("avatar generation preserves supplementary Unicode initials without URI encoding errors", () => {
  const svg = decodeURIComponent(
    createPlaceholderProfilePhotoUrl("😀 Riya", 4).split(",", 2)[1] ?? "",
  );
  assert.ok(svg.includes(">😀R</text>"));
});
