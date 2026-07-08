-- Convert Entry.category from enum to plain text so categories can be user-defined
ALTER TABLE "Entry" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;

DROP TYPE "EntryCategory";

-- Per-user category list
CREATE TABLE "Category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" FORCE ROW LEVEL SECURITY;

CREATE POLICY category_user_select ON "Category"
FOR SELECT
USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY category_user_insert ON "Category"
FOR INSERT
WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY category_user_update ON "Category"
FOR UPDATE
USING ("userId" = current_setting('app.current_user_id', true))
WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY category_user_delete ON "Category"
FOR DELETE
USING ("userId" = current_setting('app.current_user_id', true));

GRANT SELECT, INSERT, UPDATE, DELETE ON "Category" TO app_runtime;

-- Seed the previous fixed categories for every user that already has entries
INSERT INTO "Category" ("userId", "name")
SELECT existing."userId", defaults.name
FROM (SELECT DISTINCT "userId" FROM "Entry") AS existing
CROSS JOIN (VALUES ('Study'), ('Finance'), ('Health'), ('Personal')) AS defaults(name)
ON CONFLICT ("userId", "name") DO NOTHING;
