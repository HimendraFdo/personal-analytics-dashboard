-- Add nullable owner field first so existing production rows do not block deploy.
ALTER TABLE "Entry" ADD COLUMN "userId" TEXT;

CREATE INDEX "Entry_userId_idx" ON "Entry"("userId");
CREATE INDEX "Entry_userId_date_idx" ON "Entry"("userId", "date" DESC);
