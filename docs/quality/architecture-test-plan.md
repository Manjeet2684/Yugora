# Gate 1 Architecture Test Plan

These tests exercise domain and application behavior through in-memory adapters. They are not substitutes for Gate 2 SQLite tests or Gate 3 HTTP integration tests.

| Test | Expected assertion |
|---|---|
| Mutual LIKE | Reciprocal LIKE decisions satisfy the matching policy |
| Missing reciprocal | No match |
| Reciprocal PASS | No match |
| Wrong actor/target pair | No match |
| Feed with incoming LIKE | Profile stays eligible |
| Feed with viewer PASS | Profile is excluded |
| DTO allow-list | Internal/private properties do not serialize |
| LIKE with reciprocal | Exactly one match result is returned |
| LIKE without reciprocal | Decision only; no Match |
| PASS with incoming LIKE | Decision only; no Match |
| Identical retry | No duplicate Swipe or Match |
| Opposite retry | `SWIPE_CONFLICT` |
| Match query | Only stored match rows for the current user are returned |
| Match canonicalization | Participant ordering is stable |
| Transaction failure | Newly inserted Swipe rolls back if match persistence fails |
| Self swipe | Rejected before persistence |
| Invalid direction | Rejected before persistence |

## Later-gate test obligations

### Gate 2

- Run migrations against a fresh SQLite database.
- Verify foreign keys, unique indexes, and CHECK constraints.
- Run the seed script twice and prove it is idempotent.
- Verify the minimum profile count and known incoming-like demo scenarios.

### Gate 3

- Test all required route methods and status codes.
- Test malformed JSON, missing fields, unknown profile IDs, invalid direction, and conflicts.
- Verify transaction rollback against SQLite.
- Verify feed and match responses contain no non-mutual incoming interest.
- Verify concurrent identical swipes do not create duplicate records.

### Gate 4/5

- Playwright journeys for pass, like, mutual match, reload, empty feed, and request failure.
- Mobile drag and desktop button paths must use the same mutation.
- Reduced-motion and keyboard controls must remain functional.
- Simulate image, feed, swipe, and matches failures independently.
