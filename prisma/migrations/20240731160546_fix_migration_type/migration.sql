/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `events` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "initialMigration" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("email", "id", "initialMigration", "name") SELECT "email", "id", "initialMigration", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
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