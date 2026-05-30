ALTER TABLE "Entry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Entry" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entry_user_select ON "Entry";
DROP POLICY IF EXISTS entry_user_insert ON "Entry";
DROP POLICY IF EXISTS entry_user_update ON "Entry";
DROP POLICY IF EXISTS entry_user_delete ON "Entry";

CREATE POLICY entry_user_select ON "Entry"
FOR SELECT
USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY entry_user_insert ON "Entry"
FOR INSERT
WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY entry_user_update ON "Entry"
FOR UPDATE
USING ("userId" = current_setting('app.current_user_id', true))
WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY entry_user_delete ON "Entry"
FOR DELETE
USING ("userId" = current_setting('app.current_user_id', true));
