ALTER TABLE "AIConversation"
ADD COLUMN "title" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AIMessage"
ADD COLUMN "metadata" JSONB;

CREATE INDEX "AIConversation_userId_updatedAt_idx"
ON "AIConversation"("userId", "updatedAt");
