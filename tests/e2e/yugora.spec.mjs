// Copyright (c) 2026 Manjeet2684. All rights reserved.
import { test, expect } from "@playwright/test";

const profileA = {"id":"profile-avery","name":"Avery Morgan","age":25,"photoUrl":"https://images.example.test/avery.jpg","bio":"A curious mind, a full camera roll, and a weakness for good coffee.","locationLabel":"New Delhi","interests":["Photography","Coffee","Travel"]};
const profileB = {"id":"profile-jordan","name":"Jordan Patel","age":27,"photoUrl":"https://images.example.test/jordan.jpg","bio":"Weekend trail seeker and weekday product builder.","locationLabel":"Gurugram","interests":["Hiking","Design","Music"]};
const mutualMatch = {"id":"match-avery","profile":{"id":"profile-avery","name":"Avery Morgan","age":25,"photoUrl":"https://images.example.test/avery.jpg","bio":"A curious mind, a full camera roll, and a weakness for good coffee.","locationLabel":"New Delhi","interests":["Photography","Coffee","Travel"]},"matchedAt":"2026-11-18T12:00:00.000Z"};
const noMatch = { success: true, matched: false, matchCreated: false, match: null };
const errorPayload = (message) => ({
  success: false,
  error: { code: "SERVICE_UNAVAILABLE", message, retryable: true },
});
const json = (body, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

async function stubApi(page, options = {}) {
  const profiles = options.profiles ?? [profileA, profileB];
  const decisions = new Set();
  const swipeRequests = [];
  let matches = [...(options.matches ?? [])];
  let feedCalls = 0;
  let matchesCalls = 0;
  let swipeCalls = 0;

  await page.route("**/feed", async (route) => {
    feedCalls += 1;
    if (options.feedFailsOnce && feedCalls === 1) {
      await route.fulfill(json(errorPayload("The feed is temporarily unavailable."), 503));
      return;
    }
    await route.fulfill(json({ profiles: profiles.filter((profile) => !decisions.has(profile.id)) }));
  });

  await page.route("**/matches", async (route) => {
    matchesCalls += 1;
    if (options.matchesFailOnce && matchesCalls === 1) {
      await route.fulfill(json(errorPayload("Matches could not be loaded."), 503));
      return;
    }
    await route.fulfill(json({ matches }));
  });

  await page.route("**/swipe", async (route) => {
    const request = route.request().postDataJSON();
    swipeRequests.push(request);
    swipeCalls += 1;
    if (options.swipeFailsOnce && swipeCalls === 1) {
      await route.fulfill(json(errorPayload("Your decision could not be saved. Please try again."), 503));
      return;
    }
    const result = options.swipeResult ? await options.swipeResult(request, swipeCalls) : noMatch;
    if (!result.success) {
      await route.fulfill(json(result, result.status ?? 400));
      return;
    }
    decisions.add(request.profileId);
    if (result.matched && result.match) matches = [result.match, ...matches.filter((item) => item.id !== result.match.id)];
    await route.fulfill(json(result));
  });

  return { swipeRequests, decisions };
}

async function openDiscover(page, options = {}) {
  const server = await stubApi(page, options);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Discover." })).toBeVisible();
  return server;
}

test("opens Discover with one profile card and accessible Like/Pass actions", async ({ page }) => {
  await openDiscover(page);
  await expect(page.locator(".profile-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Avery Morgan, 25" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pass on this profile" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Like this profile" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" }).first()).toBeVisible();
});

test("Home stays intentionally blank and navigation returns to Discover", async ({ page }) => {
  await openDiscover(page);
  await page.getByRole("button", { name: "Home" }).click();
  const home = page.locator('[aria-label="Home tab placeholder"]');
  await expect(home).toBeVisible();
  await expect(home).toBeEmpty();
  await page.getByRole("button", { name: "Discover" }).click();
  await expect(page.getByRole("heading", { name: "Discover." })).toBeVisible();
});

test("Pass records the direction and advances to the next profile", async ({ page }) => {
  const server = await openDiscover(page);
  await page.getByRole("button", { name: "Pass on this profile" }).click();
  await expect(page.getByRole("heading", { name: "Jordan Patel, 27" })).toBeVisible();
  expect(server.swipeRequests).toEqual([{ profileId: profileA.id, direction: "PASS" }]);
});

test("a one-sided Like does not show a match celebration", async ({ page }) => {
  const server = await openDiscover(page);
  await page.getByRole("button", { name: "Like this profile" }).click();
  await expect(page.getByRole("heading", { name: "Jordan Patel, 27" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(server.swipeRequests[0]).toEqual({ profileId: profileA.id, direction: "LIKE" });
});

test("mutual Like celebrates only the returned match and displays it in Matches", async ({ page }) => {
  const server = await openDiscover(page, {
    swipeResult: async () => ({ success: true, matched: true, matchCreated: true, match: mutualMatch }),
  });
  await page.getByRole("button", { name: "Like this profile" }).click();
  const dialog = page.getByRole("dialog", { name: "It's a match." });
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole("button", { name: "Close match celebration" });
  await expect(close).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Keep discovering" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  await page.getByRole("button", { name: "Matches" }).click();
  await expect(page.getByRole("heading", { name: "Your matches." })).toBeVisible();
  await expect(page.locator(".match-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Avery Morgan, 25" })).toBeVisible();
  expect(server.swipeRequests[0]).toEqual({ profileId: profileA.id, direction: "LIKE" });
});

test("keyboard arrows use the same Like/Pass API mutation", async ({ page }) => {
  const server = await openDiscover(page);
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Jordan Patel, 27" })).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText("YOU ARE ALL CAUGHT UP")).toBeVisible();
  expect(server.swipeRequests).toEqual([
    { profileId: profileA.id, direction: "LIKE" },
    { profileId: profileB.id, direction: "PASS" },
  ]);
});

test("mobile-width pointer drag follows the same swipe mutation", async ({ page }) => {
  const server = await openDiscover(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".mobile-navigation")).toBeVisible();
  await expect(page.locator(".sidebar")).toBeHidden();
  const card = page.locator(".profile-card");
  const bounds = await card.boundingBox();
  expect(bounds).not.toBeNull();
  const startX = bounds.x + bounds.width / 2;
  const startY = bounds.y + bounds.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 165, startY, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole("heading", { name: "Jordan Patel, 27" })).toBeVisible();
  expect(server.swipeRequests).toEqual([{ profileId: profileA.id, direction: "PASS" }]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("a persisted server decision stays out of the feed after reload", async ({ page }) => {
  await openDiscover(page);
  await page.getByRole("button", { name: "Pass on this profile" }).click();
  await expect(page.getByRole("heading", { name: "Jordan Patel, 27" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Discover." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jordan Patel, 27" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Avery Morgan, 25" })).toHaveCount(0);
});

test("an empty feed has its own recovery state", async ({ page }) => {
  await openDiscover(page, { profiles: [] });
  await expect(page.getByText("YOU ARE ALL CAUGHT UP")).toBeVisible();
  await expect(page.getByRole("button", { name: "Check again" })).toBeVisible();
  await expect(page.locator(".profile-card")).toHaveCount(0);
});

test("feed failure is distinct and can be retried", async ({ page }) => {
  await openDiscover(page, { feedFailsOnce: true });
  await expect(page.getByRole("heading", { name: "We couldn't find your people." })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Avery Morgan, 25" })).toBeVisible();
});

test("swipe failure preserves the active card and allows retry", async ({ page }) => {
  const server = await openDiscover(page, { swipeFailsOnce: true });
  await page.getByRole("button", { name: "Like this profile" }).click();
  await expect(page.locator(".toast-error")).toContainText("could not be saved");
  await expect(page.getByRole("heading", { name: "Avery Morgan, 25" })).toBeVisible();
  await page.getByRole("button", { name: "Like this profile" }).click();
  await expect(page.getByRole("heading", { name: "Jordan Patel, 27" })).toBeVisible();
  expect(server.swipeRequests).toHaveLength(2);
});

test("matches failure has a separate retry path", async ({ page }) => {
  await openDiscover(page, { matchesFailOnce: true });
  await page.getByRole("button", { name: "Matches" }).click();
  await expect(page.locator(".inline-error")).toContainText("Matches could not be loaded.");
  await page.locator(".inline-error").getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Your story is still unfolding.")).toBeVisible();
});

test("broken profile photo falls back to the profile initial", async ({ page }) => {
  await page.route("https://i.pravatar.cc/**", (route) => route.abort());
  await openDiscover(page);
  await expect(page.locator(".profile-card .profile-image img")).toHaveCount(0);
  await expect(page.locator(".profile-card .profile-image-fallback")).toBeVisible();
  await expect(page.locator(".profile-card .profile-image-fallback")).toHaveText("A");
});

test("reduced motion is respected and every visible button has an accessible name", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openDiscover(page);
  const duration = await page.locator(".profile-card").evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001);
  const unnamedButtons = await page.locator("button").evaluateAll((buttons) => buttons.filter((button) => (
    !button.innerText.trim() && !button.getAttribute("aria-label") && !button.getAttribute("title")
  )).length);
  expect(unnamedButtons).toBe(0);
});

test("production pages send baseline security headers and do not enable cross-origin API access", async ({ page }) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["access-control-allow-origin"]).toBeUndefined();
});
