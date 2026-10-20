CREATE TABLE "ExamPaper" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "examType" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "durationSeconds" INTEGER NOT NULL CHECK ("durationSeconds" > 0),
  "questions" JSONB NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "ExamAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "paperId" TEXT NOT NULL REFERENCES "ExamPaper"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "mode" TEXT NOT NULL CHECK ("mode" IN ('practice', 'timed')),
  "snapshot" JSONB NOT NULL,
  "answers" JSONB NOT NULL DEFAULT '{}',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "autoSubmitted" BOOLEAN NOT NULL DEFAULT false,
  "elapsedSeconds" INTEGER NOT NULL DEFAULT 0,
  "score" INTEGER,
  "total" INTEGER NOT NULL,
  "result" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "ExamAttempt_userId_startedAt_idx" ON "ExamAttempt"("userId", "startedAt");
CREATE INDEX "ExamAttempt_expiresAt_submittedAt_idx" ON "ExamAttempt"("expiresAt", "submittedAt");
CREATE UNIQUE INDEX "ExamAttempt_one_active_mode" ON "ExamAttempt"("userId", "paperId", "mode") WHERE "submittedAt" IS NULL;
