-- Copyright (c) 2026 Manjeet2684. All rights reserved.
-- Enforce the product's mutual-interest invariant at the SQLite boundary.
-- A Match row is valid only while both directed LIKE records exist.

-- Clean up any legacy/corrupt Match rows before enforcing the invariant.
DELETE FROM "Match"
WHERE NOT EXISTS (
    SELECT 1
    FROM "Swipe" AS "outgoing"
    INNER JOIN "Swipe" AS "incoming"
      ON "incoming"."actorUserId" = "Match"."userHighId"
     AND "incoming"."targetUserId" = "Match"."userLowId"
     AND "incoming"."direction" = 'LIKE'
    WHERE "outgoing"."actorUserId" = "Match"."userLowId"
      AND "outgoing"."targetUserId" = "Match"."userHighId"
      AND "outgoing"."direction" = 'LIKE'
);

CREATE TRIGGER "Match_require_reciprocal_like_insert"
BEFORE INSERT ON "Match"
FOR EACH ROW
WHEN NOT EXISTS (
    SELECT 1
    FROM "Swipe" AS "outgoing"
    INNER JOIN "Swipe" AS "incoming"
      ON "incoming"."actorUserId" = NEW."userHighId"
     AND "incoming"."targetUserId" = NEW."userLowId"
     AND "incoming"."direction" = 'LIKE'
    WHERE "outgoing"."actorUserId" = NEW."userLowId"
      AND "outgoing"."targetUserId" = NEW."userHighId"
      AND "outgoing"."direction" = 'LIKE'
)
BEGIN
    SELECT RAISE(ABORT, 'Match requires reciprocal LIKE swipes');
END;

CREATE TRIGGER "Match_require_reciprocal_like_update"
BEFORE UPDATE OF "userLowId", "userHighId" ON "Match"
FOR EACH ROW
WHEN NOT EXISTS (
    SELECT 1
    FROM "Swipe" AS "outgoing"
    INNER JOIN "Swipe" AS "incoming"
      ON "incoming"."actorUserId" = NEW."userHighId"
     AND "incoming"."targetUserId" = NEW."userLowId"
     AND "incoming"."direction" = 'LIKE'
    WHERE "outgoing"."actorUserId" = NEW."userLowId"
      AND "outgoing"."targetUserId" = NEW."userHighId"
      AND "outgoing"."direction" = 'LIKE'
)
BEGIN
    SELECT RAISE(ABORT, 'Match requires reciprocal LIKE swipes');
END;

-- A persisted swipe is a durable decision. Changing direction or participants
-- would bypass the application's conflicting-decision rule.
CREATE TRIGGER "Swipe_decision_fields_are_immutable"
BEFORE UPDATE OF "actorUserId", "targetUserId", "direction" ON "Swipe"
FOR EACH ROW
WHEN OLD."actorUserId" <> NEW."actorUserId"
  OR OLD."targetUserId" <> NEW."targetUserId"
  OR OLD."direction" <> NEW."direction"
BEGIN
    SELECT RAISE(ABORT, 'Persisted swipe decisions are immutable');
END;

-- If either side's swipe is deleted (including as part of user deletion),
-- remove the match so the database cannot retain a stale mutual connection.
CREATE TRIGGER "Swipe_delete_removes_pair_match"
AFTER DELETE ON "Swipe"
FOR EACH ROW
BEGIN
    DELETE FROM "Match"
    WHERE ("userLowId" = OLD."actorUserId" AND "userHighId" = OLD."targetUserId")
       OR ("userLowId" = OLD."targetUserId" AND "userHighId" = OLD."actorUserId");
END;
