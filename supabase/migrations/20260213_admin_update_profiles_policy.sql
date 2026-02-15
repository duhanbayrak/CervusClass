-- 20260213_admin_update_profiles_policy.sql
-- Admin'in kendi organizasyonundaki profilleri güncelleyebilmesi için RLS policy'si

-- Mevcut profiles SELECT policy'si kök seviyede (auth.jwt()->>'organization_id') kullanıyor.
-- Tutarlılık için aynı path'i kullanıyoruz.

-- Admin: Kendi org'undaki profilleri güncelleyebilir
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles
    FOR UPDATE
    USING (
        organization_id = (auth.jwt()->>'organization_id')::uuid
        AND (auth.jwt()->>'role') = 'admin'
    )
    WITH CHECK (
        organization_id = (auth.jwt()->>'organization_id')::uuid
        AND (auth.jwt()->>'role') = 'admin'
    );

-- Kullanıcı kendi profilini güncelleyebilir (öğrenci/öğretmen kendi bilgilerini düzenler)
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
