-- =============================================
-- KDV Entegrasyonu ve Hizmet/Ürün Yönetimi
-- Migration: finance_services tablosu + KDV sütunları
-- =============================================

-- 1. finance_services tablosu
CREATE TABLE IF NOT EXISTS finance_services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    category_id uuid REFERENCES finance_categories(id) ON DELETE SET NULL,
    unit_price numeric(12,2) NOT NULL DEFAULT 0,
    vat_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (vat_rate >= 0 AND vat_rate <= 100),
    is_active boolean NOT NULL DEFAULT true,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Yorum
COMMENT ON TABLE finance_services IS 'Hizmet ve ürün tanımları — her birinin birim fiyatı ve KDV oranı vardır';
COMMENT ON COLUMN finance_services.unit_price IS 'KDV hariç birim fiyat';
COMMENT ON COLUMN finance_services.vat_rate IS 'KDV oranı (yüzde cinsinden, örn: 10 = %10)';

-- 2. Performans indeksleri (multi-tenant sorgular için kritik)
CREATE INDEX IF NOT EXISTS idx_finance_services_org_active
    ON finance_services (organization_id, is_active)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_finance_services_org_type
    ON finance_services (organization_id, type);

-- 3. RLS etkinleştirme
ALTER TABLE finance_services ENABLE ROW LEVEL SECURITY;

-- 4. RLS politikaları (her işlem için ayrı, organization_id zorunlu)

-- SELECT: Kullanıcı sadece kendi organizasyonunun hizmetlerini görebilir
CREATE POLICY "finance_services_select_own_org"
    ON finance_services
    FOR SELECT
    TO authenticated
    USING (organization_id = get_auth_org_id());

-- INSERT: Kullanıcı sadece kendi organizasyonuna hizmet ekleyebilir
CREATE POLICY "finance_services_insert_own_org"
    ON finance_services
    FOR INSERT
    TO authenticated
    WITH CHECK (organization_id = get_auth_org_id());

-- UPDATE: Kullanıcı sadece kendi organizasyonunun hizmetlerini güncelleyebilir
CREATE POLICY "finance_services_update_own_org"
    ON finance_services
    FOR UPDATE
    TO authenticated
    USING (organization_id = get_auth_org_id())
    WITH CHECK (organization_id = get_auth_org_id());

-- DELETE: Kullanıcı sadece kendi organizasyonunun hizmetlerini silebilir
CREATE POLICY "finance_services_delete_own_org"
    ON finance_services
    FOR DELETE
    TO authenticated
    USING (organization_id = get_auth_org_id());

-- =============================================
-- 5. finance_transactions tablosuna KDV sütunları
-- =============================================

ALTER TABLE finance_transactions
    ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES finance_services(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subtotal numeric(12,2),
    ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vat_amount numeric(12,2) DEFAULT 0;

COMMENT ON COLUMN finance_transactions.service_id IS 'İşlemin bağlı olduğu hizmet/ürün';
COMMENT ON COLUMN finance_transactions.subtotal IS 'KDV hariç tutar';
COMMENT ON COLUMN finance_transactions.vat_rate IS 'Uygulanan KDV oranı (yüzde)';
COMMENT ON COLUMN finance_transactions.vat_amount IS 'KDV tutarı (TL)';

-- Mevcut kayıtları düzgün hale getir: subtotal = amount, vat = 0
UPDATE finance_transactions
SET subtotal = amount, vat_rate = 0, vat_amount = 0
WHERE subtotal IS NULL;

-- =============================================
-- 6. student_fees tablosuna KDV sütunları
-- =============================================

ALTER TABLE student_fees
    ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES finance_services(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vat_amount numeric(12,2) DEFAULT 0;

COMMENT ON COLUMN student_fees.service_id IS 'Ücretin bağlı olduğu hizmet';
COMMENT ON COLUMN student_fees.vat_rate IS 'Uygulanan KDV oranı (yüzde)';
COMMENT ON COLUMN student_fees.vat_amount IS 'KDV tutarı (TL)';

-- Mevcut kayıtları düzgün hale getir
UPDATE student_fees
SET vat_rate = 0, vat_amount = 0
WHERE vat_rate IS NULL;

-- =============================================
-- 7. Ek performans indeksleri
-- =============================================

-- finance_transactions: organization_id + transaction_date (raporlama sorguları)
CREATE INDEX IF NOT EXISTS idx_finance_transactions_org_date
    ON finance_transactions (organization_id, transaction_date);

-- finance_transactions: service_id ile hızlı JOIN
CREATE INDEX IF NOT EXISTS idx_finance_transactions_service
    ON finance_transactions (service_id)
    WHERE service_id IS NOT NULL;

-- student_fees: organization_id + status (liste sorguları)
CREATE INDEX IF NOT EXISTS idx_student_fees_org_status
    ON student_fees (organization_id, status);

-- student_fees: service_id ile hızlı JOIN
CREATE INDEX IF NOT EXISTS idx_student_fees_service
    ON student_fees (service_id)
    WHERE service_id IS NOT NULL;

-- fee_installments: organization_id + status + due_date (vadesi geçmiş taksit sorguları)
CREATE INDEX IF NOT EXISTS idx_fee_installments_org_status_due
    ON fee_installments (organization_id, status, due_date);
