# System Overview

YUGORA is a two-tab social discovery application. Home is a placeholder; Discover contains profile browsing, LIKE/PASS decisions, and access to confirmed matches.

## Logical request flow

1. The client requests GET /feed.
2. An HTTP adapter resolves the demo user through CurrentUserPort.
3. GetFeedUseCase asks the profile repository for active candidates not already swiped on by that user.
4. The DTO projection allow-lists public profile data; incoming interest is not serialized.
5. A LIKE/PASS action calls POST /swipe.
6. The use case records the directed decision and checks reciprocal LIKE inside one Unit of Work.
7. If reciprocal LIKE exists, a canonical Match is committed and the API confirms the match.
8. GET /matches reads persisted matches only.

## Persistence model

Core concepts: User, Profile, Interest, ProfileInterest, Swipe, and Match. Swipe stores directed decisions. Match stores only confirmed mutual connections and represents the user pair canonically so order does not create duplicates.

## Reliability

The database is the source of truth. Duplicate same-direction retries are idempotent. Database uniqueness constraints are the final guard against duplicate swipes and matches. User-specific API responses are private and non-cacheable.
