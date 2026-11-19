# YUGORA HTTP API

The API is implemented as Next.js App Router Route Handlers. It uses the existing application use cases and the configured single demo user; the browser never chooses the acting user ID.

All user-specific responses, including errors, use `Cache-Control: private, no-store, no-cache, max-age=0, must-revalidate`, `Pragma: no-cache`, and `X-Content-Type-Options: nosniff`.

## GET `/feed`

Returns profiles eligible for the configured demo user:

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

A profile is excluded only after the viewer has made a directed swipe on it. Incoming LIKEs do not remove a profile from the feed. The public DTO allow-list excludes user IDs, incoming-like flags/counts, Swipe rows, Match rows, and hidden-interest metadata.

## POST `/swipe`

Requires `Content-Type: application/json`. The request body is limited to 4 KiB and accepts exactly these fields:

```json
{
  "profileId": "profile_001",
  "direction": "LIKE"
}
```

`profileId` must be a non-empty string of at most 128 characters. `direction` is exactly `LIKE` or `PASS`. Unknown fields—including `actorUserId`—are rejected. The server resolves the acting user from `CurrentUserPort`.

Successful non-match response:

```json
{
  "success": true,
  "matched": false,
  "matchCreated": false,
  "match": null
}
```

Successful mutual-match response contains `matched: true` and the confirmed match DTO. An identical retry is idempotent; `matchCreated` is false when the Match already existed. An opposite decision for an already-recorded directed pair returns 409.

## GET `/matches`

Returns persisted mutual matches for the configured demo user only:

```json
{ "matches": [] }
```

A one-sided incoming LIKE is never returned as a Match.

## Error envelope

All errors use this stable shape:

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

| Status | Meaning | Example code |
|---:|---|---|
| 400 | Invalid request or malformed JSON | `INVALID_REQUEST`, `INVALID_JSON` |
| 404 | Target profile unavailable | `PROFILE_NOT_FOUND` |
| 409 | Conflicting prior decision | `SWIPE_CONFLICT` |
| 413 | Request body exceeds 4 KiB | `PAYLOAD_TOO_LARGE` |
| 415 | Unsupported content type | `UNSUPPORTED_MEDIA_TYPE` |
| 500 | Unexpected server/invariant failure | `INTERNAL_SERVER_ERROR` |
| 503 | Recognized transient database/adapter outage | `SERVICE_UNAVAILABLE` |

Unexpected error details, SQL, adapter messages, stack traces and filesystem paths are never returned to clients.

## Assignment identity model

The assignment explicitly says no external auth is needed and assumes one logged-in user. Gate 3 therefore retains the documented `DEMO_USER_ID` server-side adapter. This is an assignment/demo identity boundary, not production multi-user authentication. The API does not accept an actor ID from the browser.
