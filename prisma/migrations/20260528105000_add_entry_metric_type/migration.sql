ALTER TABLE "Entry" ADD COLUMN "metricType" TEXT NOT NULL DEFAULT 'time';

CREATE INDEX "Entry_userId_metricType_idx" ON "Entry"("userId", "metricType");
