/*
  Warnings:

  - The primary key for the `events` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "arguments" TEXT NOT NULL,
    "body" TEXT,
    "created_at" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "event_id" BIGINT NOT NULL,
    "message" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "subject_id" BIGINT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "verb" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    CONSTRAINT "events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_events" ("arguments", "author", "body", "created_at", "description", "event_id", "id", "message", "path", "subject_id", "subject_type", "userId", "verb") SELECT "arguments", "author", "body", "created_at", "description", "event_id", "id", "message", "path", "subject_id", "subject_type", "userId", "verb" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE UNIQUE INDEX "events_event_id_key" ON "events"("event_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
