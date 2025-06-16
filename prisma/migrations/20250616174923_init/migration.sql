-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "tag" TEXT,
    "startUTCTimestamp" DATETIME,
    "spiciness" INTEGER DEFAULT 3,
    "isCompleted" BOOLEAN DEFAULT false,
    "order" INTEGER DEFAULT 0,
    "totalEstimatedTime" INTEGER DEFAULT 0,
    "note" TEXT DEFAULT '',
    "goalDifficulty" TEXT DEFAULT 'MEDIUM',
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" DATETIME,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TEXT DEFAULT '',
    "isVoiceDump" BOOLEAN DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_userId_fcmToken_key" ON "UserDevice"("userId", "fcmToken");
