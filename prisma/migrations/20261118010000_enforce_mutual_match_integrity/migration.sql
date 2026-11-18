-- Copyright (c) 2026 Manjeet2684. All rights reserved.
-- Enforce YUGORA's mutual-interest invariants at the PostgreSQL boundary.

-- Remove legacy or corrupt rows before activating the invariant.
DELETE FROM "Match" AS m
WHERE NOT EXISTS (
    SELECT 1
    FROM "Swipe" AS outgoing
    INNER JOIN "Swipe" AS incoming
      ON incoming."actorUserId" = m."userHighId"
     AND incoming."targetUserId" = m."userLowId"
     AND incoming."direction" = 'LIKE'
    WHERE outgoing."actorUserId" = m."userLowId"
      AND outgoing."targetUserId" = m."userHighId"
      AND outgoing."direction" = 'LIKE'
);

-- A boolean-returning wrapper allows Prisma's typed raw-query decoder to
-- consume the lock result while PostgreSQL still holds the lock to transaction end.
CREATE OR REPLACE FUNCTION yugora_acquire_pair_lock(lock_namespace INTEGER, lock_key INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $
BEGIN
    PERFORM pg_advisory_xact_lock(lock_namespace, lock_key);
    RETURN TRUE;
END;
$;

CREATE OR REPLACE FUNCTION yugora_enforce_match_reciprocal_like()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM "Swipe" AS outgoing
        INNER JOIN "Swipe" AS incoming
          ON incoming."actorUserId" = NEW."userHighId"
         AND incoming."targetUserId" = NEW."userLowId"
         AND incoming."direction" = 'LIKE'
        WHERE outgoing."actorUserId" = NEW."userLowId"
          AND outgoing."targetUserId" = NEW."userHighId"
          AND outgoing."direction" = 'LIKE'
    ) THEN
        RAISE EXCEPTION USING
          ERRCODE = '23514',
          MESSAGE = 'Match requires reciprocal LIKE swipes';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "Match_require_reciprocal_like_insert"
BEFORE INSERT ON "Match"
FOR EACH ROW
EXECUTE FUNCTION yugora_enforce_match_reciprocal_like();

CREATE TRIGGER "Match_require_reciprocal_like_update"
BEFORE UPDATE OF "userLowId", "userHighId" ON "Match"
FOR EACH ROW
EXECUTE FUNCTION yugora_enforce_match_reciprocal_like();

CREATE OR REPLACE FUNCTION yugora_reject_swipe_decision_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD."actorUserId" IS DISTINCT FROM NEW."actorUserId"
       OR OLD."targetUserId" IS DISTINCT FROM NEW."targetUserId"
       OR OLD."direction" IS DISTINCT FROM NEW."direction" THEN
        RAISE EXCEPTION USING
          ERRCODE = '23514',
          MESSAGE = 'Persisted swipe decisions are immutable';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "Swipe_decision_fields_are_immutable"
BEFORE UPDATE ON "Swipe"
FOR EACH ROW
EXECUTE FUNCTION yugora_reject_swipe_decision_update();

CREATE OR REPLACE FUNCTION yugora_remove_match_after_swipe_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    lower_user_id TEXT;
    higher_user_id TEXT;
BEGIN
    IF OLD."actorUserId" COLLATE "C" < OLD."targetUserId" COLLATE "C" THEN
        lower_user_id := OLD."actorUserId";
        higher_user_id := OLD."targetUserId";
    ELSE
        lower_user_id := OLD."targetUserId";
        higher_user_id := OLD."actorUserId";
    END IF;

    DELETE FROM "Match"
    WHERE "userLowId" = lower_user_id
      AND "userHighId" = higher_user_id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER "Swipe_delete_removes_pair_match"
AFTER DELETE ON "Swipe"
FOR EACH ROW
EXECUTE FUNCTION yugora_remove_match_after_swipe_delete();
