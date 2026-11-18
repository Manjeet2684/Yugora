# HTTP API Contract Baseline

The routes are implemented in Gate 3. This document fixes the intended contract before transport code is added.

## GET `/feed`

Returns active profiles that have not been swiped on by the server-configured demo user.

```json
{
  "profiles": [
    {
      "id": "profile_001",
      "name": "Riya",
      "age": 23,
      "photoUrl": "/profiles/riya.jpg",
      "bio": "Coffee lover and weekend explorer.",
      "locationLabel": "Delhi",
      "interests": ["Travel", "Photography", "Music"]
    }
  ]
}
```

The response must not contain incoming-like flags, like counts, internal user IDs, swipe rows, or match eligibility hints.

## POST `/swipe`

Request:

```json
{
  "profileId": "profile_001",
  "direction": "LIKE"
}
```

`direction` is exactly `LIKE` or `PASS`. The browser must not send an actor user ID.

Successful non-match response:

```json
{
  "success": true,
  "matched": false,
  "matchCreated": false,
  "match": null
}
```

Successful mutual-match response:

```json
{
  "success": true,
  "matched": true,
  "matchCreated": true,
  "match": {
    "id": "match_001",
    "profile": {
      "id": "profile_001",
      "name": "Riya",
      "age": 23,
      "photoUrl": "/profiles/riya.jpg",
      "bio": "Coffee lover and weekend explorer.",
      "locationLabel": "Delhi",
      "interests": ["Travel", "Photography", "Music"]
    },
    "matchedAt": "2026-11-18T12:00:00.000Z"
  }
}
```

An identical retry returns the current result but sets `matchCreated` to false if the Match already existed. A different direction for an already-recorded pair returns a conflict.

## GET `/matches`

Returns persisted mutual matches for the configured demo user only.

```json
{
  "matches": []
}
```

## Error envelope

```json
{
  "success": false,
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "This profile is unavailable.",
    "retryable": false
  }
}
```

Expected status mapping:

| Status | Meaning | Example |
|---:|---|---|
| 400 | Invalid request | Invalid direction or malformed body |
| 404 | Target unavailable | Profile not found or inactive |
| 409 | Decision conflict | Opposite swipe already exists |
| 500 | Unexpected failure | Unhandled application error |
| 503 | Temporary service failure | Database unavailable |

Private/user-specific responses must not be shared-cached. Route handlers must serialize DTOs, not ORM entities.
