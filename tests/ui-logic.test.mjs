// Copyright (c) 2026 Manjeet2684. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { getSwipeTilt, resolveSwipeDirection } from '../.build/src/modules/discovery/ui/swipe-gesture.js';

test('rightward horizontal drag resolves to LIKE only beyond threshold', () => {
  assert.equal(resolveSwipeDirection(111, 0), null);
  assert.equal(resolveSwipeDirection(112, 0), 'LIKE');
  assert.equal(resolveSwipeDirection(240, 20), 'LIKE');
});

test('leftward horizontal drag resolves to PASS only beyond threshold', () => {
  assert.equal(resolveSwipeDirection(-111, 0), null);
  assert.equal(resolveSwipeDirection(-112, 0), 'PASS');
  assert.equal(resolveSwipeDirection(-240, -20), 'PASS');
});

test('vertical and diagonally dominant gestures do not trigger a swipe', () => {
  assert.equal(resolveSwipeDirection(20, 180), null);
  assert.equal(resolveSwipeDirection(150, 160), null);
  assert.equal(resolveSwipeDirection(-150, -170), null);
});

test('invalid drag values and invalid thresholds are ignored', () => {
  assert.equal(resolveSwipeDirection(Number.NaN, 0), null);
  assert.equal(resolveSwipeDirection(200, Number.POSITIVE_INFINITY), null);
  assert.equal(resolveSwipeDirection(200, 0, 0), null);
});

test('card tilt is bounded and safe for invalid values', () => {
  assert.equal(getSwipeTilt(18), 1);
  assert.equal(getSwipeTilt(9999), 13);
  assert.equal(getSwipeTilt(-9999), -13);
  assert.equal(getSwipeTilt(Number.NaN), 0);
});
