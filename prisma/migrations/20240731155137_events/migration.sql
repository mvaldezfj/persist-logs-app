/*
  Warnings:

  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Session";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "initialMigration" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "events_event_id_key" ON "events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
