// Copyright (c) 2026 Manjeet2684. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';

import { isMutualLike } from '../.build/src/modules/discovery/domain/policies/mutual-match-policy.js';
import { createSwipeDecision } from '../.build/src/modules/discovery/domain/entities/swipe-decision.js';
import { asUserId, asProfileId, asSwipeId, asMatchId } from '../.build/src/modules/discovery/domain/values/identifiers.js';
import { createMatch } from '../.build/src/modules/discovery/domain/entities/match.js';
import { GetFeedUseCase } from '../.build/src/modules/discovery/application/use-cases/get-feed.use-case.js';
import { RecordSwipeUseCase } from '../.build/src/modules/discovery/application/use-cases/record-swipe.use-case.js';
import { GetMatchesUseCase } from '../.build/src/modules/discovery/application/use-cases/get-matches.use-case.js';

const demoUserId = asUserId('user_demo');
const riyaUserId = asUserId('user_riya');
const aaravUserId = asUserId('user_aarav');
const riyaProfileId = asProfileId('profile_riya');
const aaravProfileId = asProfileId('profile_aarav');

function profile({ id, ownerUserId, name, extra = {} }) {
  return {
    id,
    ownerUserId,
    name,
    age: 23,
    photoUrl: `/profiles/${name.toLowerCase()}.jpg`,
    bio: `${name}'s demo bio`,
    locationLabel: 'Delhi',
    interests: ['Music', 'Travel'],
    isActive: true,
    displayOrder: 1,
    ...extra,
  };
}

function decision({ id, actor, target, direction }) {
  return createSwipeDecision({
    id: asSwipeId(id),
    actorUserId: actor,
    targetUserId: target,
    direction,
    createdAt: new Date('2026-11-18T10:00:00.000Z'),
  });
}

class InMemoryStore {
  constructor(profiles = []) {
    this.profiles = profiles;
    this.swipes = new Map();
    this.matches = new Map();
    this.profileRepository = {
      listEligibleForViewer: async (viewerId) => this.profiles.filter((item) =>
        item.isActive && item.ownerUserId !== viewerId &&
        !this.swipes.has(`${viewerId}->${item.ownerUserId}`),
      ),
      findActiveById: async (profileId) => this.profiles.find((item) =>
        item.id === profileId && item.isActive,
      ) ?? null,
      findByOwnerUserId: async (ownerUserId) => this.profiles.find((item) =>
        item.ownerUserId === ownerUserId,
      ) ?? null,
    };
    this.swipeRepository = {
      findDecision: async (actor, target) => this.swipes.get(`${actor}->${target}`) ?? null,
      createIfAbsent: async (item) => {
        const key = `${item.actorUserId}->${item.targetUserId}`;
        const existing = this.swipes.get(key);
        if (existing) return { decision: existing, created: false };
        this.swipes.set(key, item);
        return { decision: item, created: true };
      },
    };
    this.matchRepository = {
      findBetween: async (first, second) => this.matches.get(this.matchKey(first, second)) ?? null,
      createIfAbsent: async (item) => {
        const key = this.matchKey(item.userLowId, item.userHighId);
        const existing = this.matches.get(key);
        if (existing) return { match: existing, created: false };
        this.matches.set(key, item);
        return { match: item, created: true };
      },
      listForUser: async (userId) => [...this.matches.values()].filter((item) =>
        item.userLowId === userId || item.userHighId === userId,
      ),
    };
    this.seedSwipe = (item) => {
      this.swipes.set(`${item.actorUserId}->${item.targetUserId}`, item);
    };
    this.unitOfWork = {
      execute: async (operation) => {
        const swipeSnapshot = new Map(this.swipes);
        const matchSnapshot = new Map(this.matches);
        try {
          return await operation({
            profiles: this.profileRepository,
            swipes: this.swipeRepository,
            matches: this.matchRepository,
          });
        } catch (error) {
          this.swipes = swipeSnapshot;
          this.matches = matchSnapshot;
          throw error;
        }
      },
    };
  }

  matchKey(first, second) {
    return [first, second].sort().join('::');
  }
}

function currentUser(userId = demoUserId) {
  return { getCurrentUserId: async () => userId };
}

function makeRecordSwipe(store, options = {}) {
  let sequence = 0;
  return new RecordSwipeUseCase(
    currentUser(options.userId ?? demoUserId),
    store.unitOfWork,
    () => `generated_${++sequence}`,
    () => new Date('2026-11-18T12:00:00.000Z'),
  );
}

test('mutual match policy requires two reciprocal LIKE decisions', () => {
  const outgoingLike = decision({ id: 's1', actor: demoUserId, target: riyaUserId, direction: 'LIKE' });
  const incomingLike = decision({ id: 's2', actor: riyaUserId, target: demoUserId, direction: 'LIKE' });
  const incomingPass = decision({ id: 's3', actor: riyaUserId, target: demoUserId, direction: 'PASS' });
  const unrelatedLike = decision({ id: 's4', actor: aaravUserId, target: riyaUserId, direction: 'LIKE' });

  assert.equal(isMutualLike(outgoingLike, incomingLike), true);
  assert.equal(isMutualLike(outgoingLike, null), false);
  assert.equal(isMutualLike(outgoingLike, incomingPass), false);
  assert.equal(isMutualLike(outgoingLike, unrelatedLike), false);

  const outgoingPass = decision({ id: 's5', actor: demoUserId, target: riyaUserId, direction: 'PASS' });
  assert.equal(isMutualLike(outgoingPass, incomingLike), false);
});

test('feed excludes only profiles the viewer has already swiped on', async () => {
  const store = new InMemoryStore([
    profile({ id: riyaProfileId, ownerUserId: riyaUserId, name: 'Riya', extra: { internalLikeCount: 99 } }),
    profile({ id: aaravProfileId, ownerUserId: aaravUserId, name: 'Aarav' }),
  ]);
  await store.seedSwipe(decision({
    id: 'seed_incoming', actor: riyaUserId, target: demoUserId, direction: 'LIKE',
  }));
  await store.seedSwipe(decision({
    id: 'seed_outgoing', actor: demoUserId, target: aaravUserId, direction: 'PASS',
  }));

  const useCase = new GetFeedUseCase(currentUser(), store.profileRepository);
  const feed = await useCase.execute();

  assert.deepEqual(feed.map((item) => item.id), [riyaProfileId]);
  assert.equal('internalLikeCount' in feed[0], false);
  assert.equal('likedYou' in feed[0], false);
  assert.equal('incomingLike' in feed[0], false);
});

test('LIKE creates a match when a reciprocal seeded LIKE exists', async () => {
  const store = new InMemoryStore([
    profile({ id: riyaProfileId, ownerUserId: riyaUserId, name: 'Riya' }),
  ]);
  await store.seedSwipe(decision({
    id: 'seed_riya_like', actor: riyaUserId, target: demoUserId, direction: 'LIKE',
  }));

  const result = await makeRecordSwipe(store).execute({ profileId: riyaProfileId, direction: 'LIKE' });

  assert.equal(result.success, true);
  assert.equal(result.matched, true);
  assert.equal(result.matchCreated, true);
  assert.equal(result.match.profile.name, 'Riya');
  assert.equal(store.matches.size, 1);
  assert.equal(store.swipes.size, 2);
});

test('LIKE without a reciprocal LIKE records a decision but does not create a match', async () => {
  const store = new InMemoryStore([
    profile({ id: aaravProfileId, ownerUserId: aaravUserId, name: 'Aarav' }),
  ]);

  const result = await makeRecordSwipe(store).execute({ profileId: aaravProfileId, direction: 'LIKE' });

  assert.equal(result.matched, false);
  assert.equal(result.match, null);
  assert.equal(store.swipes.size, 1);
  assert.equal(store.matches.size, 0);
});

test('PASS never creates a match, even when an incoming LIKE exists', async () => {
  const store = new InMemoryStore([
    profile({ id: riyaProfileId, ownerUserId: riyaUserId, name: 'Riya' }),
  ]);
  await store.seedSwipe(decision({
    id: 'seed_riya_like', actor: riyaUserId, target: demoUserId, direction: 'LIKE',
  }));

  const result = await makeRecordSwipe(store).execute({ profileId: riyaProfileId, direction: 'PASS' });

  assert.equal(result.matched, false);
  assert.equal(result.match, null);
  assert.equal(store.matches.size, 0);
});

test('repeating the same swipe is idempotent and does not duplicate a match', async () => {
  const store = new InMemoryStore([
    profile({ id: riyaProfileId, ownerUserId: riyaUserId, name: 'Riya' }),
  ]);
  await store.seedSwipe(decision({
    id: 'seed_riya_like', actor: riyaUserId, target: demoUserId, direction: 'LIKE',
  }));
  const useCase = makeRecordSwipe(store);

  const first = await useCase.execute({ profileId: riyaProfileId, direction: 'LIKE' });
  const second = await useCase.execute({ profileId: riyaProfileId, direction: 'LIKE' });

  assert.equal(first.matched, true);
  assert.equal(first.matchCreated, true);
  assert.equal(second.matched, true);
  assert.equal(second.matchCreated, false);
  assert.equal(store.swipes.size, 2);
  assert.equal(store.matches.size, 1);
});

test('opposite decision after a recorded swipe is rejected as a conflict', async () => {
  const store = new InMemoryStore([
    profile({ id: aaravProfileId, ownerUserId: aaravUserId, name: 'Aarav' }),
  ]);
  const useCase = makeRecordSwipe(store);
  await useCase.execute({ profileId: aaravProfileId, direction: 'PASS' });

  await assert.rejects(
    () => useCase.execute({ profileId: aaravProfileId, direction: 'LIKE' }),
    { name: 'SwipeConflictError', code: 'SWIPE_CONFLICT' },
  );
  assert.equal(store.swipes.size, 1);
});

test('matches query returns only persisted mutual match records', async () => {
  const store = new InMemoryStore([
    profile({ id: riyaProfileId, ownerUserId: riyaUserId, name: 'Riya' }),
    profile({ id: aaravProfileId, ownerUserId: aaravUserId, name: 'Aarav' }),
  ]);
  const mutual = createMatch({
    id: asMatchId('match_riya'),
    participantA: demoUserId,
    participantB: riyaUserId,
    matchedAt: new Date('2026-11-18T11:00:00.000Z'),
  });
  await store.matchRepository.createIfAbsent(mutual);

  const useCase = new GetMatchesUseCase(currentUser(), store.matchRepository, store.profileRepository);
  const results = await useCase.execute();

  assert.equal(results.length, 1);
  assert.equal(results[0].profile.name, 'Riya');
  assert.equal(results[0].profile.id, riyaProfileId);
  assert.equal('likedYou' in results[0].profile, false);
});

test('canonical match pair is order-independent', () => {
  const first = createMatch({
    id: asMatchId('match_a'), participantA: demoUserId, participantB: riyaUserId,
    matchedAt: new Date('2026-11-18T12:00:00.000Z'),
  });
  const second = createMatch({
    id: asMatchId('match_b'), participantA: riyaUserId, participantB: demoUserId,
    matchedAt: new Date('2026-11-18T12:00:00.000Z'),
  });
  assert.equal(first.userLowId, second.userLowId);
  assert.equal(first.userHighId, second.userHighId);
});

test('failed match persistence rolls back the newly inserted swipe in the unit of work', async () => {
  const store = new InMemoryStore([
    profile({ id: riyaProfileId, ownerUserId: riyaUserId, name: 'Riya' }),
  ]);
  store.seedSwipe(decision({
    id: 'seed_riya_like', actor: riyaUserId, target: demoUserId, direction: 'LIKE',
  }));
  store.matchRepository.createIfAbsent = async () => {
    throw new Error('Simulated persistence failure while creating match.');
  };

  await assert.rejects(
    () => makeRecordSwipe(store).execute({ profileId: riyaProfileId, direction: 'LIKE' }),
    /Simulated persistence failure/,
  );
  assert.equal(store.swipes.has(`${demoUserId}->${riyaUserId}`), false);
  assert.equal(store.matches.size, 0);
});

test('self-swipes are rejected before any decision is persisted', async () => {
  const selfProfileId = asProfileId('profile_demo');
  const store = new InMemoryStore([
    profile({ id: selfProfileId, ownerUserId: demoUserId, name: 'Demo User' }),
  ]);

  await assert.rejects(
    () => makeRecordSwipe(store).execute({ profileId: selfProfileId, direction: 'LIKE' }),
    { name: 'InvalidSwipeCommandError', code: 'INVALID_SWIPE' },
  );
  assert.equal(store.swipes.size, 0);
});

test('invalid swipe direction is rejected before persistence', async () => {
  const store = new InMemoryStore([
    profile({ id: riyaProfileId, ownerUserId: riyaUserId, name: 'Riya' }),
  ]);

  await assert.rejects(
    () => makeRecordSwipe(store).execute({ profileId: riyaProfileId, direction: 'MAYBE' }),
    { name: 'InvalidSwipeCommandError', code: 'INVALID_SWIPE' },
  );
  assert.equal(store.swipes.size, 0);
});

test('concurrent identical LIKE requests converge to one Swipe and one Match', async () => {
  const store = new InMemoryStore([
    profile({ id: riyaProfileId, ownerUserId: riyaUserId, name: 'Riya' }),
  ]);
  store.seedSwipe(decision({
    id: 'seed_riya_like', actor: riyaUserId, target: demoUserId, direction: 'LIKE',
  }));
  const useCase = makeRecordSwipe(store);

  const results = await Promise.all([
    useCase.execute({ profileId: riyaProfileId, direction: 'LIKE' }),
    useCase.execute({ profileId: riyaProfileId, direction: 'LIKE' }),
  ]);

  assert.equal(results.every((result) => result.matched), true);
  assert.equal(store.swipes.size, 2);
  assert.equal(store.matches.size, 1);
});

test('unknown profile is rejected without creating a Swipe', async () => {
  const store = new InMemoryStore([]);

  await assert.rejects(
    () => makeRecordSwipe(store).execute({ profileId: riyaProfileId, direction: 'LIKE' }),
    { name: 'ProfileNotFoundError', code: 'PROFILE_NOT_FOUND' },
  );
  assert.equal(store.swipes.size, 0);
});
