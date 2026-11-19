// Copyright (c) 2026 Manjeet2684. All rights reserved.
import { test, expect } from "@playwright/test";

const profileA = {"id":"profile-avery","name":"Avery Morgan","age":25,"photoUrl":"data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2010%2010%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23334%22%2F%3E%3C%2Fsvg%3E","bio":"A curious mind, a full camera roll, and a weakness for good coffee.","locationLabel":"New Delhi","interests":["Photography","Coffee","Travel"]};
const profileB = {"id":"profile-jordan","name":"Jordan Patel","age":27,"photoUrl":"data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2010%2010%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23475%22%2F%3E%3C%2Fsvg%3E","bio":"Weekend trail seeker and weekday product builder.","locationLabel":"Gurugram","interests":["Hiking","Design","Music"]};
const mutualMatch = {"id":"match-avery","profile":{"id":"profile-avery","name":"Avery Morgan","age":25,"photoUrl":"data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2010%2010%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23334%22%2F%3E%3C%2Fsvg%3E","bio":"A curious mind, a full camera roll, and a weakness for good coffee.","locationLabel":"New Delhi","interests":["Photography","Coffee","Travel"]},"matchedAt":"2026-11-18T12:00:00.000Z"};
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
  let resetCalls = 0;

  await page.route("**/feed", async (route) => {
    feedCalls += 1;
    if (options.feedFailsOnce && feedCalls === 1) {
      await route.fulfill(json(errorPayload("The feed is temporarily unavailable."), 503));
      return;
    }
    await route.fulfill(json({ profiles: profiles.filter((profile) => !decisions.has(profile.id)) }));
  });

  await page.route("**/api/feed/reset", async (route) => {
    resetCalls += 1;
    decisions.clear();
    await route.fulfill(json({ resetCount: 1 }));
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

  return { swipeRequests, decisions, get resetCalls() { return resetCalls; } };
}

async function openDiscover(page, options = {}) {
  const server = await stubApi(page, options);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good connections/ })).toBeVisible();
  await page.getByRole("button", { name: "Explore Discover" }).click();
  await expect(page.getByRole("heading", { name: "Discover." })).toBeVisible();
  return server;
}

test("real PostgreSQL-backed browser journey persists a seeded mutual match across reload", async ({ page }) => {
  // This test intentionally does not intercept /feed, /swipe or /matches.
  // The seeded Riya profile has a directed incoming LIKE from its owner to demo-user.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good connections/ })).toBeVisible();
  await page.getByRole("button", { name: "Explore Discover" }).click();
  await expect(page.getByRole("heading", { name: "Discover." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Riya Mehta, 24" })).toBeVisible();
  await page.getByRole("button", { name: "Like this profile" }).click();

  const dialog = page.getByRole("dialog", { name: "It's a match." });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: /Good connections/ })).toBeVisible();
  await page.getByRole("button", { name: "Explore Discover" }).click();
  await expect(page.getByRole("heading", { name: "Discover." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Riya Mehta, 24" })).toHaveCount(0);

  await page.getByRole("button", { name: "Matches" }).click();
  await expect(page.getByRole("heading", { name: "Your matches." })).toBeVisible();
  await expect(page.locator(".match-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Riya Mehta, 24" })).toBeVisible();
});

test("opens Discover with one profile card and accessible Like/Pass actions", async ({ page }) => {
  await openDiscover(page);
  await expect(page.locator(".profile-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Avery Morgan, 25" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pass on this profile" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Like this profile" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" }).first()).toBeVisible();
});

test("Home explains the YUGORA promise and offers profile and discovery actions", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good connections/ })).toBeVisible();
  await expect(page.getByText("Your interest is yours.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit your profile" })).toBeVisible();
  await page.getByRole("button", { name: "Explore Discover" }).click();
  await expect(page.getByRole("heading", { name: "Discover." })).toBeVisible();
  await page.getByRole("button", { name: "Home" }).click();
  await expect(page.getByRole("heading", { name: /Good connections/ })).toBeVisible();
});

test("a signed-in member edits their profile and adds a custom hobby", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good connections/ })).toBeVisible();
  await page.getByRole("button", { name: "Edit your profile" }).click();
  await expect(page.getByRole("heading", { name: "Your profile." })).toBeVisible();
  await page.getByRole("button", { name: /Swimming/ }).click();
  await page.getByPlaceholder("Or write your own hobby…").fill("Bathroom singer");
  await page.getByRole("button", { name: "Add hobby" }).click();
  await expect(page.getByRole("button", { name: /Bathroom singer/ })).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForTimeout(250);
  const profileSaveError = await page.locator(".profile-form .form-error").textContent().catch(() => null);
  if (profileSaveError) throw new Error("PROFILE_SAVE_ERROR: " + profileSaveError);
  await expect(page.getByRole("heading", { name: /Good connections/ })).toBeVisible();
  await expect(page.getByText("YUGORA Guest, 25")).toBeVisible();
});

test("Pass records the direction, gives accurate feedback and advances", async ({ page }) => {
  const server = await openDiscover(page);
  await page.getByRole("button", { name: "Pass on this profile" }).click();
  await expect(page.locator(".screen-reader-status")).toHaveText("You passed on Avery Morgan.");
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

test("desktop hover adds depth without triggering a swipe", async ({ page }) => {
  const server = await openDiscover(page);
  const card = page.locator(".profile-card");
  const image = page.locator(".profile-card-photo img");
  await expect(image).toBeVisible();
  await card.hover({ position: { x: 180, y: 160 } });
  await expect.poll(() => image.evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
  await expect(page.getByRole("heading", { name: "Avery Morgan, 25" })).toBeVisible();
  expect(server.swipeRequests).toHaveLength(0);
});

test("arrow shortcuts do not swipe while an interactive control has focus", async ({ page }) => {
  const server = await openDiscover(page);
  const likeButton = page.getByRole("button", { name: "Like this profile" });
  await likeButton.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Avery Morgan, 25" })).toBeVisible();
  await expect(likeButton).toBeFocused();
  expect(server.swipeRequests).toHaveLength(0);
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

test("real mobile touch drag follows the same swipe mutation", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  try {
    await page.addInitScript(() => {
      window.__yugoraPointerTypes = [];
      window.addEventListener("pointerdown", (event) => window.__yugoraPointerTypes.push(event.pointerType), true);
    });
    const server = await openDiscover(page);
    await expect(page.locator(".mobile-navigation")).toBeVisible();
    await expect(page.locator(".sidebar")).toBeHidden();
    const card = page.locator(".profile-card");
    const bounds = await card.boundingBox();
    expect(bounds).not.toBeNull();
    const startX = bounds.x + bounds.width / 2;
    const startY = bounds.y + bounds.height / 2;
    const touch = await context.newCDPSession(page);
    const touchPoint = (x) => ({ x, y: startY, id: 1, radiusX: 4, radiusY: 4, force: 1 });
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [touchPoint(startX)] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [touchPoint(startX - 165)] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByRole("heading", { name: "Jordan Patel, 27" })).toBeVisible();
    expect(server.swipeRequests).toEqual([{ profileId: profileA.id, direction: "PASS" }]);
    const pointerTypes = await page.evaluate(() => window.__yugoraPointerTypes);
    expect(pointerTypes).toContain("touch");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  } finally {
    await context.close();
  }
});

test("the API fixture excludes a server-confirmed decision from the next feed after reload", async ({ page }) => {
  await openDiscover(page);
  await page.getByRole("button", { name: "Pass on this profile" }).click();
  await expect(page.getByRole("heading", { name: "Jordan Patel, 27" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Good connections/ })).toBeVisible();
  await page.getByRole("button", { name: "Explore Discover" }).click();
  await expect(page.getByRole("heading", { name: "Discover." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jordan Patel, 27" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Avery Morgan, 25" })).toHaveCount(0);
});

test("an empty feed has its own recovery state", async ({ page }) => {
  const server = await openDiscover(page, { profiles: [] });
  await expect(page.getByText("YOU ARE ALL CAUGHT UP")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start a new round" })).toBeVisible();
  await expect(page.locator(".profile-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Start a new round" }).click();
  await expect.poll(() => server.resetCalls).toBe(1);
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
  await page.route("**/intentionally-missing-avatar.svg", (route) => route.fulfill({ status: 404, contentType: "image/svg+xml", body: "" }));
  await openDiscover(page, { profiles: [{ ...profileA, photoUrl: "/intentionally-missing-avatar.svg" }] });
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
