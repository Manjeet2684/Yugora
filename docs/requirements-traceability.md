# Requirements Traceability

| Requirement | Design / verification |
|---|---|
| Home tab is a placeholder | Frontend gate |
| Discover is the functional area | Frontend gate |
| At least 30 mock profiles | Seed-data gate |
| Profiles already liked the demo user exist | Seed-data gate; stored as directed Swipe rows |
| Previously swiped profiles never reappear | Feed use case and persistence/API tests |
| Only reciprocal LIKE creates a match | Domain mutual-match policy and RecordSwipeUseCase tests |
| Non-mutual incoming interest stays hidden | DTO allow-list and privacy regression tests |
| Swipe decisions persist across reloads | Database persistence gate |
| GET /feed, POST /swipe, GET /matches | API contract and backend gate |
| Match UI waits for server confirmation | Frontend state-controller and E2E tests |
