// Copyright (c) 2026 Manjeet2684. All rights reserved.
import type { SwipeDirection } from "../domain/entities/swipe-decision.js";

/** Resolves a horizontal drag into a domain swipe intent. Vertical gestures are ignored. */
export function resolveSwipeDirection(
  deltaX: number,
  deltaY: number,
  threshold = 112,
): SwipeDirection | null {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY) || threshold <= 0) return null;
  if (Math.abs(deltaX) < threshold) return null;
  if (Math.abs(deltaX) < Math.abs(deltaY) * 1.15) return null;
  return deltaX > 0 ? "LIKE" : "PASS";
}

/** A bounded visual tilt; it never decides or persists a swipe. */
export function getSwipeTilt(deltaX: number, maxDegrees = 13): number {
  if (!Number.isFinite(deltaX) || !Number.isFinite(maxDegrees) || maxDegrees < 0) return 0;
  return Math.max(-maxDegrees, Math.min(maxDegrees, deltaX / 18));
}
