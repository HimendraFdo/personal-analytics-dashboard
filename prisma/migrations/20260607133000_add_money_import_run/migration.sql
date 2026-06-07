CREATE TABLE "MoneyImportRun" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "drafts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyImportRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MoneyImportRun_userId_idx" ON "MoneyImportRun"("userId");
CREATE INDEX "MoneyImportRun_expiresAt_idx" ON "MoneyImportRun"("expiresAt");

ALTER TABLE "MoneyImportRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MoneyImportRun" FORCE ROW LEVEL SECURITY;

CREATE POLICY money_import_run_user_select ON "MoneyImportRun"
FOR SELECT
USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY money_import_run_user_insert ON "MoneyImportRun"
FOR INSERT
WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY money_import_run_user_update ON "MoneyImportRun"
FOR UPDATE
USING ("userId" = current_setting('app.current_user_id', true))
WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY money_import_run_user_delete ON "MoneyImportRun"
FOR DELETE
USING ("userId" = current_setting('app.current_user_id', true));
