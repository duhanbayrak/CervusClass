-- NOSONAR\n-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- Fix RLS policies for accounting tables - v3
-- Fixes:
-- 1. Correctly accesses 'organization_id' and 'role' from JWT 'app_metadata'
-- 2. Fixes 'fee_id' column error in fee_payments table (uses student_id)
-- 3. Defines helper functions for cleaner policies

-- Helper Functions (Ensure they exist and are correct)
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
$function$;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::text
$function$;

-- 1. finance_accounts
ALTER TABLE IF EXISTS "finance_accounts" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage finance accounts" ON "finance_accounts";
CREATE POLICY "Admin manage finance accounts" ON "finance_accounts"
    FOR ALL
    USING (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    );

DROP POLICY IF EXISTS "Users view finance accounts" ON "finance_accounts";
CREATE POLICY "Users view finance accounts" ON "finance_accounts"
    FOR SELECT
    USING (
        organization_id = get_auth_org_id()
    );

-- 2. finance_categories
ALTER TABLE IF EXISTS "finance_categories" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage finance categories" ON "finance_categories";
CREATE POLICY "Admin manage finance categories" ON "finance_categories"
    FOR ALL
    USING (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    );

DROP POLICY IF EXISTS "Users view finance categories" ON "finance_categories";
CREATE POLICY "Users view finance categories" ON "finance_categories"
    FOR SELECT
    USING (
        organization_id = get_auth_org_id()
    );

-- 3. finance_transactions
ALTER TABLE IF EXISTS "finance_transactions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage finance transactions" ON "finance_transactions";
CREATE POLICY "Admin manage finance transactions" ON "finance_transactions"
    FOR ALL
    USING (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    );

DROP POLICY IF EXISTS "Users view finance transactions" ON "finance_transactions";
CREATE POLICY "Users view finance transactions" ON "finance_transactions"
    FOR SELECT
    USING (
        organization_id = get_auth_org_id()
    );

-- 4. student_fees
ALTER TABLE IF EXISTS "student_fees" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage student fees" ON "student_fees";
CREATE POLICY "Admin manage student fees" ON "student_fees"
    FOR ALL
    USING (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    );
  
DROP POLICY IF EXISTS "Students view own fees" ON "student_fees";
CREATE POLICY "Students view own fees" ON "student_fees"
    FOR SELECT
    USING (
        student_id = auth.uid()
    );

-- 5. fee_installments
ALTER TABLE IF EXISTS "fee_installments" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage fee installments" ON "fee_installments";
CREATE POLICY "Admin manage fee installments" ON "fee_installments"
    FOR ALL
    USING (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    );

DROP POLICY IF EXISTS "Students view own installments" ON "fee_installments";
CREATE POLICY "Students view own installments" ON "fee_installments"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM student_fees
            WHERE student_fees.id = fee_installments.fee_id
            AND student_fees.student_id = auth.uid()
        )
    );

-- 6. fee_payments
ALTER TABLE IF EXISTS "fee_payments" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage fee payments" ON "fee_payments";
CREATE POLICY "Admin manage fee payments" ON "fee_payments"
    FOR ALL
    USING (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    );

DROP POLICY IF EXISTS "Students view own payments" ON "fee_payments";
CREATE POLICY "Students view own payments" ON "fee_payments"
    FOR SELECT
    USING (
        student_id = auth.uid()
    );
