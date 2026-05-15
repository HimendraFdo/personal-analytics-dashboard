-- CreateEnum
CREATE TYPE "EntryCategory" AS ENUM ('Study', 'Finance', 'Health', 'Personal');

-- CreateTable
CREATE TABLE "Entry" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "category" "EntryCategory" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Entry_date_idx" ON "Entry"("date" DESC);

-- CreateIndex
CREATE INDEX "Entry_category_idx" ON "Entry"("category");
