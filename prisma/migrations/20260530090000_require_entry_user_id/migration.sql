-- Ownerless entries cannot be safely assigned to a Clerk user after the fact.
-- Delete them before enforcing ownership at the schema level.
DELETE FROM "Entry" WHERE "userId" IS NULL;

ALTER TABLE "Entry" ALTER COLUMN "userId" SET NOT NULL;
