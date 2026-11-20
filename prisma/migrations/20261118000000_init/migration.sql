-- Copyright (c) 2026 Manjeet2684. All rights reserved.
-- Initial YUGORA PostgreSQL persistence schema.

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "locationLabel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Profile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId")
      REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Profile_adult_only_check" CHECK ("age" >= 18)
);

CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProfileInterest" (
    "profileId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileInterest_pkey" PRIMARY KEY ("profileId", "interestId"),
    CONSTRAINT "ProfileInterest_profileId_fkey" FOREIGN KEY ("profileId")
      REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileInterest_interestId_fkey" FOREIGN KEY ("interestId")
      REFERENCES "Interest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Swipe" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Swipe_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Swipe_actorUserId_fkey" FOREIGN KEY ("actorUserId")
      REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Swipe_targetUserId_fkey" FOREIGN KEY ("targetUserId")
      REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Swipe_no_self_swipe_check" CHECK ("actorUserId" <> "targetUserId"),
    CONSTRAINT "Swipe_direction_check" CHECK ("direction" IN ('LIKE', 'PASS'))
);

CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "userLowId" TEXT NOT NULL,
    "userHighId" TEXT NOT NULL,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Match_userLowId_fkey" FOREIGN KEY ("userLowId")
      REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_userHighId_fkey" FOREIGN KEY ("userHighId")
      REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_distinct_participants_check" CHECK ("userLowId" <> "userHighId"),
    -- Use the same bytewise lexical order as the application when canonicalising pairs.
    CONSTRAINT "Match_canonical_order_check"
      CHECK ("userLowId" COLLATE "C" < "userHighId" COLLATE "C")
);

CREATE UNIQUE INDEX "Profile_ownerUserId_key" ON "Profile"("ownerUserId");
CREATE INDEX "Profile_isActive_displayOrder_idx" ON "Profile"("isActive", "displayOrder");
CREATE UNIQUE INDEX "Interest_name_key" ON "Interest"("name");
CREATE INDEX "ProfileInterest_interestId_idx" ON "ProfileInterest"("interestId");
CREATE UNIQUE INDEX "Swipe_actorUserId_targetUserId_key" ON "Swipe"("actorUserId", "targetUserId");
CREATE INDEX "Swipe_targetUserId_direction_idx" ON "Swipe"("targetUserId", "direction");
CREATE INDEX "Swipe_actorUserId_createdAt_idx" ON "Swipe"("actorUserId", "createdAt");
CREATE UNIQUE INDEX "Match_userLowId_userHighId_key" ON "Match"("userLowId", "userHighId");
CREATE INDEX "Match_userLowId_matchedAt_idx" ON "Match"("userLowId", "matchedAt");
CREATE INDEX "Match_userHighId_matchedAt_idx" ON "Match"("userHighId", "matchedAt");
