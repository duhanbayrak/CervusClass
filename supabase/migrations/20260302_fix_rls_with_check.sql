-- ============================================================
-- T5 Düzeltmesi: RLS WITH CHECK Eksikliği
-- ============================================================
-- Amaç: Muhasebe tablolarındaki FOR ALL policy'lerinde WITH CHECK
--        eklenerek privilege escalation saldırıları engelleniyor.
--
-- Sorun: USING koşulu sadece okuma (SELECT) için kontrol eder.
--        INSERT ve UPDATE işlemlerinde organization_id'yi doğrulamak
--        için WITH CHECK gereklidir. Eksik olması durumunda yetkili
--        bir kullanıcı farklı bir organization_id ile kayıt
--        ekleyebilir / güncelleyebilir.
-- ============================================================

-- 1. finance_accounts
DROP POLICY IF EXISTS "Admin manage finance accounts" ON "finance_accounts";
CREATE POLICY "Admin manage finance accounts" ON "finance_accounts"
    FOR ALL
    USING (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    )
    WITH CHECK (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    );

-- 2. finance_categories
DROP POLICY IF EXISTS "Admin manage finance categories" ON "finance_categories";
CREATE POLICY "Admin manage finance categories" ON "finance_categories"
    FOR ALL
    USING (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    )
    WITH CHECK (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    );

-- 3. finance_transactions
DROP POLICY IF EXISTS "Admin manage finance transactions" ON "finance_transactions";
CREATE POLICY "Admin manage finance transactions" ON "finance_transactions"
    FOR ALL
    USING (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    )
    WITH CHECK (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    );

-- 4. student_fees
DROP POLICY IF EXISTS "Admin manage student fees" ON "student_fees";
CREATE POLICY "Admin manage student fees" ON "student_fees"
    FOR ALL
    USING (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    )
    WITH CHECK (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    );

-- 5. fee_installments
DROP POLICY IF EXISTS "Admin manage fee installments" ON "fee_installments";
CREATE POLICY "Admin manage fee installments" ON "fee_installments"
    FOR ALL
    USING (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    )
    WITH CHECK (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    );

-- 6. fee_payments
DROP POLICY IF EXISTS "Admin manage fee payments" ON "fee_payments";
CREATE POLICY "Admin manage fee payments" ON "fee_payments"
    FOR ALL
    USING (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    )
    WITH CHECK (
        organization_id = get_auth_org_id()
        AND get_auth_role() IN ('admin', 'super_admin')
    );
