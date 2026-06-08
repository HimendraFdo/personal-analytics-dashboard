-- AlterTable
ALTER TABLE "MoneyImportRun" ADD COLUMN     "warnings" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "id" DROP DEFAULT;
