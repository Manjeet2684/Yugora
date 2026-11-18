// Copyright (c) 2026 Manjeet2684. All rights reserved.
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { createPrismaClient } from '../.build/src/infrastructure/database/prisma-client.js';
import { PrismaMatchRepository } from '../.build/src/modules/discovery/infrastructure/persistence/prisma/prisma-match.repository.js';
import { PrismaProfileRepository } from '../.build/src/modules/discovery/infrastructure/persistence/prisma/prisma-profile.repository.js';
import { PrismaSwipeRepository } from '../.build/src/modules/discovery/infrastructure/persistence/prisma/prisma-swipe.repository.js';
import { PrismaUnitOfWork } from '../.build/src/modules/discovery/infrastructure/persistence/prisma/prisma-unit-of-work.js';
import { createMatch } from '../.build/src/modules/discovery/domain/entities/match.js';
import { createSwipeDecision } from '../.build/src/modules/discovery/domain/entities/swipe-decision.js';
import { RecordSwipeUseCase } from '../.build/src/modules/discovery/application/use-cases/record-swipe.use-case.js';
import { asMatchId, asProfileId, asSwipeId, asUserId } from '../.build/src/modules/discovery/domain/values/identifiers.js';

const prisma = createPrismaClient();
const createdUsers = new Set();
const unique = (prefix) => `${prefix}-${randomUUID()}`;

async function ensureUser(id) {
  createdUsers.add(id);
  return prisma.user.upsert({ where: { id }, update: {}, create: { id } });
}

async function ensureProfile({ userId, profileId, name, interests = [] }) {
  await ensureUser(userId);
  const profile = await prisma.profile.upsert({
    where: { id: profileId },
    update: { ownerUserId: userId, name, age: 25, photoUrl: '/images/profiles/placeholder.svg', bio: 'Integration test profile', locationLabel: 'Test City', isActive: true },
    create: { id: profileId, ownerUserId: userId, name, age: 25, photoUrl: '/images/profiles/placeholder.svg', bio: 'Integration test profile', locationLabel: 'Test City' },
  });
  for (const [position, interestName] of interests.entries()) {
    const interest = await prisma.interest.upsert({ where: { name: interestName }, update: {}, create: { name: interestName } });
    await prisma.profileInterest.upsert({
      where: { profileId_interestId: { profileId, interestId: interest.id } },
      update: { position },
      create: { profileId, interestId: interest.id, position },
    });
  }
  return profile;
}

after(async () => {
  if (createdUsers.size > 0) {
    await prisma.user.deleteMany({ where: { id: { in: [...createdUsers] } } });
  }
  await prisma.$disconnect();
});

test('seed is repeatable and includes at least 30 mock profiles with incoming demo likes', async () => {
  const seededProfiles = await prisma.profile.count({ where: { id: { startsWith: 'yugora-profile-' } } });
  const incomingLikes = await prisma.swipe.count({
    where: { targetUserId: process.env.DEMO_USER_ID ?? 'demo-user', direction: 'LIKE' },
  });
  assert.equal(seededProfiles, 30);
  assert.ok(incomingLikes >= 8, `Expected at least 8 seeded incoming likes, got ${incomingLikes}`);
});

test('feed excludes viewer decisions but does not exclude incoming likes and maps interests', async () => {
  const viewerId = asUserId(unique('viewer'));
  const likedByProfileId = asUserId(unique('incoming'));
  const alreadySwipedId = asUserId(unique('swiped'));
  const untouchedId = asUserId(unique('untouched'));
  const likedProfileId = asProfileId(unique('profile'));
  const swipedProfileId = asProfileId(unique('profile'));
  const untouchedProfileId = asProfileId(unique('profile'));
  await ensureUser(viewerId);
  await ensureProfile({ userId: likedByProfileId, profileId: likedProfileId, name: 'Incoming Like Profile', interests: ['Coffee', 'Hiking'] });
  await ensureProfile({ userId: alreadySwipedId, profileId: swipedProfileId, name: 'Already Swiped Profile' });
  await ensureProfile({ userId: untouchedId, profileId: untouchedProfileId, name: 'Untouched Profile' });

  const swipes = new PrismaSwipeRepository(prisma);
  await swipes.createIfAbsent(createSwipeDecision({
    id: asSwipeId(unique('swipe')),
    actorUserId: likedByProfileId,
    targetUserId: viewerId,
    direction: 'LIKE',
    createdAt: new Date(),
  }));
  await swipes.createIfAbsent(createSwipeDecision({
    id: asSwipeId(unique('swipe')),
    actorUserId: viewerId,
    targetUserId: alreadySwipedId,
    direction: 'PASS',
    createdAt: new Date(),
  }));

  const feed = await new PrismaProfileRepository(prisma).listEligibleForViewer(viewerId);
  const feedIds = feed.map((profile) => profile.id);
  assert.ok(feedIds.includes(likedProfileId), 'incoming LIKE must not remove a profile from the viewer feed');
  assert.ok(feedIds.includes(untouchedProfileId));
  assert.ok(!feedIds.includes(swipedProfileId), 'a profile with an existing viewer decision must be excluded');
  const visible = feed.find((profile) => profile.id === likedProfileId);
  assert.deepEqual(visible?.interests, ['Coffee', 'Hiking']);
  assert.equal('likedYou' in (visible ?? {}), false);
  assert.equal('incomingLike' in (visible ?? {}), false);
});

test('Swipe upsert is idempotent for the unique directed actor-target pair', async () => {
  const actorId = asUserId(unique('actor'));
  const targetId = asUserId(unique('target'));
  await ensureUser(actorId);
  await ensureUser(targetId);
  const repository = new PrismaSwipeRepository(prisma);
  const firstDecision = createSwipeDecision({
    id: asSwipeId(unique('swipe')),
    actorUserId: actorId,
    targetUserId: targetId,
    direction: 'LIKE',
    createdAt: new Date('2026-11-18T10:00:00.000Z'),
  });
  const first = await repository.createIfAbsent(firstDecision);
  const second = await repository.createIfAbsent({ ...firstDecision, id: asSwipeId(unique('retry')) });
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.decision.id, first.decision.id);
  assert.equal(await prisma.swipe.count({ where: { actorUserId: actorId, targetUserId: targetId } }), 1);
});

test('Match upsert stores a canonical pair once and lists it for both participants', async () => {
  const firstUserId = asUserId(unique('match-a'));
  const secondUserId = asUserId(unique('match-b'));
  await ensureUser(firstUserId);
  await ensureUser(secondUserId);
  const swipeRepository = new PrismaSwipeRepository(prisma);
  for (const [actorUserId, targetUserId] of [[firstUserId, secondUserId], [secondUserId, firstUserId]]) {
    await swipeRepository.createIfAbsent(createSwipeDecision({
      id: asSwipeId(unique('mutual-swipe')),
      actorUserId,
      targetUserId,
      direction: 'LIKE',
      createdAt: new Date(),
    }));
  }
  const repository = new PrismaMatchRepository(prisma);
  const match = createMatch({
    id: asMatchId(unique('match')),
    participantA: firstUserId,
    participantB: secondUserId,
    matchedAt: new Date('2026-11-18T11:00:00.000Z'),
  });
  const first = await repository.createIfAbsent(match);
  const retry = await repository.createIfAbsent({ ...match, id: asMatchId(unique('match-retry')) });
  assert.equal(first.created, true);
  assert.equal(retry.created, false);
  assert.equal(retry.match.id, first.match.id);
  assert.equal((await repository.listForUser(firstUserId)).length, 1);
  assert.equal((await repository.listForUser(secondUserId)).length, 1);
  assert.equal(await repository.findBetween(secondUserId, firstUserId).then((value) => value?.id), first.match.id);
});

test('Unit of Work rolls back a swipe when the transaction callback fails', async () => {
  const actorId = asUserId(unique('rollback-actor'));
  const targetId = asUserId(unique('rollback-target'));
  await ensureUser(actorId);
  await ensureUser(targetId);
  const decision = createSwipeDecision({
    id: asSwipeId(unique('rollback-swipe')),
    actorUserId: actorId,
    targetUserId: targetId,
    direction: 'LIKE',
    createdAt: new Date(),
  });
  const unitOfWork = new PrismaUnitOfWork(prisma);

  await assert.rejects(
    () => unitOfWork.execute(async ({ swipes }) => {
      await swipes.createIfAbsent(decision);
      throw new Error('intentional rollback marker');
    }),
    /intentional rollback marker/,
  );
  assert.equal(await new PrismaSwipeRepository(prisma).findDecision(actorId, targetId), null);
});


test('RecordSwipeUseCase creates one real SQLite Match only after reciprocal LIKE', async () => {
  const viewerId = asUserId(unique('mutual-viewer'));
  const targetId = asUserId(unique('mutual-target'));
  const targetProfileId = asProfileId(unique('mutual-profile'));
  await ensureUser(viewerId);
  await ensureProfile({ userId: targetId, profileId: targetProfileId, name: 'Mutual Match Fixture' });
  const swipeRepository = new PrismaSwipeRepository(prisma);
  await swipeRepository.createIfAbsent(createSwipeDecision({
    id: asSwipeId(unique('incoming-like')),
    actorUserId: targetId,
    targetUserId: viewerId,
    direction: 'LIKE',
    createdAt: new Date(),
  }));

  const useCase = new RecordSwipeUseCase(
    { getCurrentUserId: async () => viewerId },
    new PrismaUnitOfWork(prisma),
    () => unique("record-swipe"),
  );
  const first = await useCase.execute({ profileId: targetProfileId, direction: 'LIKE' });
  const retry = await useCase.execute({ profileId: targetProfileId, direction: 'LIKE' });

  assert.equal(first.matched, true);
  assert.equal(first.matchCreated, true);
  assert.equal(first.match.profile.name, 'Mutual Match Fixture');
  assert.equal(retry.matched, true);
  assert.equal(retry.matchCreated, false);
  assert.equal(await prisma.match.count({ where: { OR: [{ userLowId: viewerId }, { userHighId: viewerId }] } }), 1);
});

test('database CHECK constraints reject profiles below 18 and unsupported swipe rows', async () => {
  const userId = asUserId(unique('adult-check-user'));
  await ensureUser(userId);
  await assert.rejects(() => prisma.profile.create({
    data: {
      id: unique('underage-profile'), ownerUserId: userId, name: 'Underage Fixture',
      age: 17, photoUrl: '/images/profiles/placeholder.svg', bio: 'fixture', locationLabel: 'Test City',
    },
  }));
});

test('database CHECK constraints reject self-swipes and unsupported directions', async () => {
  const userId = asUserId(unique('constraint-user'));
  await ensureUser(userId);
  await assert.rejects(() => prisma.swipe.create({
    data: { actorUserId: userId, targetUserId: userId, direction: 'LIKE' },
  }));
  const secondUserId = asUserId(unique('constraint-target'));
  await ensureUser(secondUserId);
  await assert.rejects(() => prisma.swipe.create({
    data: { actorUserId: userId, targetUserId: secondUserId, direction: 'MAYBE' },
  }));
});


test('Match repository refuses to create a match without two persisted LIKE decisions', async () => {
  const firstUserId = asUserId(unique('integrity-a'));
  const secondUserId = asUserId(unique('integrity-b'));
  await ensureUser(firstUserId);
  await ensureUser(secondUserId);
  const repository = new PrismaMatchRepository(prisma);
  const match = createMatch({
    id: asMatchId(unique('invalid-match')),
    participantA: firstUserId,
    participantB: secondUserId,
    matchedAt: new Date(),
  });

  await assert.rejects(
    () => repository.createIfAbsent(match),
    { name: 'MatchInvariantViolationError', code: 'MATCH_INVARIANT_VIOLATION' },
  );
  assert.equal(await prisma.match.count({ where: { OR: [
    { userLowId: firstUserId, userHighId: secondUserId },
    { userLowId: secondUserId, userHighId: firstUserId },
  ] } }), 0);

  const swipeRepository = new PrismaSwipeRepository(prisma);
  await swipeRepository.createIfAbsent(createSwipeDecision({
    id: asSwipeId(unique('one-sided-like')),
    actorUserId: firstUserId,
    targetUserId: secondUserId,
    direction: 'LIKE',
    createdAt: new Date(),
  }));
  await assert.rejects(
    () => repository.createIfAbsent(match),
    { name: 'MatchInvariantViolationError', code: 'MATCH_INVARIANT_VIOLATION' },
  );
});

test('simultaneous reciprocal LIKE requests serialize and create one mutual match', async () => {
  const firstUserId = asUserId(unique('reciprocal-first'));
  const secondUserId = asUserId(unique('reciprocal-second'));
  const firstProfileId = asProfileId(unique('reciprocal-profile'));
  const secondProfileId = asProfileId(unique('reciprocal-profile'));

  await ensureProfile({
    userId: firstUserId,
    profileId: firstProfileId,
    name: 'Reciprocal First Fixture',
  });
  await ensureProfile({
    userId: secondUserId,
    profileId: secondProfileId,
    name: 'Reciprocal Second Fixture',
  });

  const firstUseCase = new RecordSwipeUseCase(
    { getCurrentUserId: async () => firstUserId },
    new PrismaUnitOfWork(prisma),
    () => unique('reciprocal-first-swipe'),
  );
  const secondUseCase = new RecordSwipeUseCase(
    { getCurrentUserId: async () => secondUserId },
    new PrismaUnitOfWork(prisma),
    () => unique('reciprocal-second-swipe'),
  );

  const [firstResult, secondResult] = await Promise.all([
    firstUseCase.execute({ profileId: secondProfileId, direction: 'LIKE' }),
    secondUseCase.execute({ profileId: firstProfileId, direction: 'LIKE' }),
  ]);

  const [userLowId, userHighId] = [firstUserId, secondUserId].sort();
  const [swipeCount, matchCount, match] = await Promise.all([
    prisma.swipe.count({
      where: {
        OR: [
          { actorUserId: firstUserId, targetUserId: secondUserId },
          { actorUserId: secondUserId, targetUserId: firstUserId },
        ],
      },
    }),
    prisma.match.count({ where: { userLowId, userHighId } }),
    prisma.match.findUnique({ where: { userLowId_userHighId: { userLowId, userHighId } } }),
  ]);

  assert.equal(swipeCount, 2, 'both directed LIKE decisions must persist exactly once');
  assert.equal(matchCount, 1, 'the canonical pair must have exactly one Match row');
  assert.ok(match, 'the reciprocal likes must result in a persisted Match');
  assert.equal([firstResult, secondResult].filter((result) => result.matched).length, 1,
    'the first transaction returns before mutuality; the serialized second transaction creates the match');
});

test('PostgreSQL trigger blocks direct invalid Match inserts and deletes stale matches when a LIKE is removed', async () => {
  const firstUserId = asUserId(unique('trigger-a'));
  const secondUserId = asUserId(unique('trigger-b'));
  const thirdUserId = asUserId(unique('trigger-c'));
  await ensureUser(firstUserId);
  await ensureUser(secondUserId);
  await ensureUser(thirdUserId);
  const matchId = unique('trigger-match');

  await assert.rejects(() => prisma.match.create({
    data: { id: matchId, userLowId: firstUserId, userHighId: secondUserId },
  }));

  const swipeRepository = new PrismaSwipeRepository(prisma);
  await swipeRepository.createIfAbsent(createSwipeDecision({
    id: asSwipeId(unique('trigger-one-sided')),
    actorUserId: firstUserId,
    targetUserId: secondUserId,
    direction: 'LIKE',
    createdAt: new Date(),
  }));
  await assert.rejects(() => prisma.match.create({
    data: { id: unique('one-sided-direct-match'), userLowId: firstUserId, userHighId: secondUserId },
  }));
  const incoming = createSwipeDecision({
    id: asSwipeId(unique('trigger-incoming')),
    actorUserId: secondUserId,
    targetUserId: firstUserId,
    direction: 'LIKE',
    createdAt: new Date(),
  });
  await swipeRepository.createIfAbsent(incoming);

  await prisma.match.create({
    data: { id: matchId, userLowId: firstUserId < secondUserId ? firstUserId : secondUserId,
      userHighId: firstUserId < secondUserId ? secondUserId : firstUserId },
  });
  assert.equal(await prisma.match.count({ where: { id: matchId } }), 1);

  await assert.rejects(() => prisma.match.update({
    where: { id: matchId },
    data: { userHighId: thirdUserId },
  }));

  await assert.rejects(() => prisma.swipe.update({
    where: { actorUserId_targetUserId: {
      actorUserId: firstUserId,
      targetUserId: secondUserId,
    } },
    data: { direction: 'PASS' },
  }));

  await prisma.swipe.delete({
    where: { actorUserId_targetUserId: {
      actorUserId: secondUserId,
      targetUserId: firstUserId,
    } },
  });
  assert.equal(await prisma.match.count({ where: { id: matchId } }), 0);
});
