// Copyright (c) 2026 Manjeet2684. All rights reserved.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { createPrismaClient } from '../.build/src/infrastructure/database/prisma-client.js';
import { createPrismaDiscoveryApplication } from '../.build/src/modules/discovery/infrastructure/persistence/prisma/create-prisma-discovery-application.js';
import { createDiscoveryHttpHandlers } from '../.build/src/modules/discovery/http/discovery-route-handlers.js';
import { asUserId } from '../.build/src/modules/discovery/domain/values/identifiers.js';

const prisma = createPrismaClient();
const createdUsers = new Set();
const unique = (prefix) => `${prefix}-${randomUUID()}`;
const testIds = {
  viewer: asUserId(unique('http-viewer')),
  mutual: asUserId(unique('http-mutual')),
  oneSided: asUserId(unique('http-one-sided')),
  alreadyPassed: asUserId(unique('http-already-passed')),
  passTarget: asUserId(unique('http-pass-target')),
};
let handlers;
let profileIds;

async function ensureUser(id) {
  createdUsers.add(id);
  await prisma.user.upsert({ where: { id }, update: {}, create: { id } });
}

async function ensureProfile(ownerUserId, name) {
  const id = unique('http-profile');
  await prisma.profile.create({
    data: {
      id,
      ownerUserId,
      name,
      age: 25,
      photoUrl: '/images/profiles/placeholder.svg',
      bio: `${name} integration fixture`,
      locationLabel: 'Test City',
      isActive: true,
    },
  });
  return id;
}

async function createIncomingLike(actorUserId, targetUserId) {
  await prisma.swipe.create({
    data: { actorUserId, targetUserId, direction: 'LIKE' },
  });
}

function post(body, options = {}) {
  const headers = new Headers(options.headers ?? {});
  if (options.contentType !== null) {
    headers.set('content-type', options.contentType ?? 'application/json');
  }
  return new Request('https://yugora.test/swipe', {
    method: 'POST',
    headers,
    body,
  });
}

async function assertPrivateNoStore(response) {
  assert.match(response.headers.get('cache-control') ?? '', /private/);
  assert.match(response.headers.get('cache-control') ?? '', /no-store/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
}

before(async () => {
  await Promise.all(Object.values(testIds).map(ensureUser));
  const [mutualProfile, oneSidedProfile, alreadyPassedProfile, passProfile, ownProfile] = await Promise.all([
    ensureProfile(testIds.mutual, 'Mutual Match Fixture'),
    ensureProfile(testIds.oneSided, 'One-sided Interest Fixture'),
    ensureProfile(testIds.alreadyPassed, 'Already Passed Fixture'),
    ensureProfile(testIds.passTarget, 'Pass Target Fixture'),
    ensureProfile(testIds.viewer, 'Demo User Fixture'),
  ]);
  profileIds = { mutualProfile, oneSidedProfile, alreadyPassedProfile, passProfile, ownProfile };

  await createIncomingLike(testIds.mutual, testIds.viewer);
  await createIncomingLike(testIds.oneSided, testIds.viewer);
  await prisma.swipe.create({
    data: { actorUserId: testIds.viewer, targetUserId: testIds.alreadyPassed, direction: 'PASS' },
  });

  const application = createPrismaDiscoveryApplication({
    prisma,
    currentUser: { getCurrentUserId: async () => testIds.viewer },
  });
  handlers = createDiscoveryHttpHandlers(application);
});

after(async () => {
  if (createdUsers.size > 0) {
    await prisma.user.deleteMany({ where: { id: { in: [...createdUsers] } } });
  }
  await prisma.$disconnect();
});

test('GET /feed returns eligible public profiles and keeps incoming interest private', async () => {
  const response = await handlers.getFeed();
  assert.equal(response.status, 200);
  await assertPrivateNoStore(response);
  const body = await response.json();
  assert.deepEqual(Object.keys(body), ['profiles']);
  const ids = body.profiles.map((profile) => profile.id);
  assert.ok(ids.includes(profileIds.mutualProfile), 'incoming LIKE must not remove a profile from the feed');
  assert.ok(ids.includes(profileIds.oneSidedProfile));
  assert.ok(ids.includes(profileIds.passProfile));
  assert.ok(!ids.includes(profileIds.alreadyPassedProfile), 'a profile already swiped on must not reappear');
  assert.ok(!ids.includes(profileIds.ownProfile), 'the viewer must never see their own profile');

  const incomingProfile = body.profiles.find((profile) => profile.id === profileIds.oneSidedProfile);
  assert.deepEqual(Object.keys(incomingProfile).sort(), [
    'id', 'name', 'age', 'photoUrl', 'bio', 'locationLabel', 'interests',
  ].sort());
  const serialized = JSON.stringify(body);
  for (const forbidden of ['likedYou', 'incomingLike', 'incomingLikeCount', 'ownerUserId', 'actorUserId', 'targetUserId']) {
    assert.equal(serialized.includes(forbidden), false, `Feed must not expose ${forbidden}`);
  }
});

test('POST /swipe records LIKE and returns a match only after reciprocal LIKE', async () => {
  const response = await handlers.postSwipe(post(JSON.stringify({
    profileId: profileIds.mutualProfile,
    direction: 'LIKE',
  })));
  assert.equal(response.status, 200);
  await assertPrivateNoStore(response);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.matched, true);
  assert.equal(body.matchCreated, true);
  assert.equal(body.match.profile.id, profileIds.mutualProfile);
  assert.equal('ownerUserId' in body.match.profile, false);

  const retry = await handlers.postSwipe(post(JSON.stringify({
    profileId: profileIds.mutualProfile,
    direction: 'LIKE',
  })));
  const retryBody = await retry.json();
  assert.equal(retry.status, 200);
  assert.equal(retryBody.matched, true);
  assert.equal(retryBody.matchCreated, false, 'idempotent retry must not claim it created a second match');
  assert.equal(await prisma.match.count({
    where: { OR: [{ userLowId: testIds.viewer }, { userHighId: testIds.viewer }] },
  }), 1);
});

test('GET /matches exposes confirmed mutual matches, never one-sided incoming interest', async () => {
  const response = await handlers.getMatches();
  assert.equal(response.status, 200);
  await assertPrivateNoStore(response);
  const body = await response.json();
  assert.deepEqual(Object.keys(body), ['matches']);
  assert.equal(body.matches.length, 1);
  assert.equal(body.matches[0].profile.id, profileIds.mutualProfile);
  assert.notEqual(body.matches[0].profile.id, profileIds.oneSidedProfile);
  const serialized = JSON.stringify(body);
  assert.equal(serialized.includes('likedYou'), false);
  assert.equal(serialized.includes('incomingLike'), false);
});

test('POST /swipe records PASS and an opposite retry returns 409', async () => {
  const passResponse = await handlers.postSwipe(post(JSON.stringify({
    profileId: profileIds.passProfile,
    direction: 'PASS',
  })));
  assert.equal(passResponse.status, 200);
  const passBody = await passResponse.json();
  assert.equal(passBody.matched, false);
  assert.equal(passBody.match, null);
  assert.equal(await prisma.swipe.count({
    where: { actorUserId: testIds.viewer, targetUserId: testIds.passTarget, direction: 'PASS' },
  }), 1);

  const conflict = await handlers.postSwipe(post(JSON.stringify({
    profileId: profileIds.passProfile,
    direction: 'LIKE',
  })));
  assert.equal(conflict.status, 409);
  const conflictBody = await conflict.json();
  assert.equal(conflictBody.error.code, 'SWIPE_CONFLICT');
  assert.match(conflictBody.error.message, /different decision/i);
});

test('POST /swipe returns 400 for malformed JSON, invalid direction, extra actor IDs and self-swipes', async () => {
  const malformed = await handlers.postSwipe(post('{'));
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error.code, 'INVALID_JSON');

  const invalidDirection = await handlers.postSwipe(post(JSON.stringify({
    profileId: profileIds.passProfile,
    direction: 'like',
  })));
  assert.equal(invalidDirection.status, 400);

  const actorOverride = await handlers.postSwipe(post(JSON.stringify({
    profileId: profileIds.passProfile,
    direction: 'LIKE',
    actorUserId: 'attacker-controlled-user',
  })));
  assert.equal(actorOverride.status, 400);
  assert.match((await actorOverride.json()).error.message, /acting user is resolved by the server/i);

  const selfSwipe = await handlers.postSwipe(post(JSON.stringify({
    profileId: profileIds.ownProfile,
    direction: 'LIKE',
  })));
  assert.equal(selfSwipe.status, 400);
  assert.equal((await selfSwipe.json()).error.code, 'INVALID_SWIPE');
});

test('POST /swipe rejects unsupported media types and oversized request bodies', async () => {
  const unsupported = await handlers.postSwipe(post('{}', { contentType: 'text/plain' }));
  assert.equal(unsupported.status, 415);
  assert.equal((await unsupported.json()).error.code, 'UNSUPPORTED_MEDIA_TYPE');

  const tooLarge = await handlers.postSwipe(post(JSON.stringify({
    profileId: profileIds.passProfile,
    direction: 'LIKE',
    extra: 'x'.repeat(5_000),
  })));
  assert.equal(tooLarge.status, 413);
  assert.equal((await tooLarge.json()).error.code, 'PAYLOAD_TOO_LARGE');
});

test('POST /swipe returns 404 for unknown profiles and keeps profile data private', async () => {
  const response = await handlers.postSwipe(post(JSON.stringify({
    profileId: unique('missing-profile'),
    direction: 'LIKE',
  })));
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'PROFILE_NOT_FOUND');
});

test('HTTP error mapping hides internal error details and marks transient database errors retryable', async () => {
  const unexpected = new Error('SQLITE secret path /private/db password=not-for-client');
  const failingHandlers = createDiscoveryHttpHandlers({
    getFeed: { execute: async () => { throw unexpected; } },
    recordSwipe: { execute: async () => { throw unexpected; } },
    getMatches: { execute: async () => { throw unexpected; } },
  });
  const internal = await failingHandlers.getFeed();
  assert.equal(internal.status, 500);
  const internalBody = await internal.json();
  assert.equal(internalBody.error.code, 'INTERNAL_SERVER_ERROR');
  assert.equal(JSON.stringify(internalBody).includes('private/db'), false);
  assert.equal(JSON.stringify(internalBody).includes('not-for-client'), false);

  const unavailable = new Error('Underlying adapter configuration and path must not leak');
  unavailable.name = 'PrismaClientInitializationError';
  const unavailableHandlers = createDiscoveryHttpHandlers({
    getFeed: { execute: async () => { throw unavailable; } },
    recordSwipe: { execute: async () => { throw unavailable; } },
    getMatches: { execute: async () => { throw unavailable; } },
  });
  const serviceUnavailable = await unavailableHandlers.getMatches();
  assert.equal(serviceUnavailable.status, 503);
  const unavailableBody = await serviceUnavailable.json();
  assert.equal(unavailableBody.error.code, 'SERVICE_UNAVAILABLE');
  assert.equal(unavailableBody.error.retryable, true);
  assert.equal(JSON.stringify(unavailableBody).includes('Underlying adapter'), false);
});
