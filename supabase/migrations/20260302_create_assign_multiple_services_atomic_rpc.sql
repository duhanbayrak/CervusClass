-- ============================================================
-- T2: assign_multiple_services_atomic — İlk taslak
-- ============================================================
-- NOT: Bu migration yalnızca fonksiyonun iskeletini oluşturur.
-- Tam implementasyon ve downPaymentAccountId NULLIF hotfix'i
-- 20260310_fix_assign_multiple_services_uuid_nullif.sql
-- migration'ında CREATE OR REPLACE ile uygulanmaktadır.
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_multiple_services_atomic(
    p_organization_id   UUID,
    p_student_id        UUID,
    p_class_id          UUID,
    p_academic_period   TEXT,
    p_created_by        UUID,
    p_services          JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Tam implementasyon 20260310_fix_assign_multiple_services_uuid_nullif.sql
    -- migration'ında bulunmaktadır.
    RETURN jsonb_build_object('success', false, 'error', 'Not implemented in this migration version.');
END;
$$;

REVOKE ALL ON FUNCTION public.assign_multiple_services_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_multiple_services_atomic TO authenticated;
