-- ============================================================
-- T1 Düzeltmesi: Atomik Öğrenci Ücreti İptal RPC Fonksiyonu
-- ============================================================
-- Amaç: cancelStudentFee işlemini (bekleyen taksit iptali +
--        opsiyonel iade muhasebesi + student_fees status güncellemesi)
--        tek bir PostgreSQL transaction içinde atomik olarak yapar.
--        Herhangi bir adımda hata oluşursa tüm işlem otomatik geri alınır.
-- ============================================================

CREATE OR REPLACE FUNCTION public.cancel_student_fee_atomic(
    -- Hangi ücret iptal ediliyor
    p_fee_id            UUID,
    p_organization_id   UUID,
    p_cancelled_by      UUID,
    -- İptal sebebi (opsiyonel)
    p_reason            TEXT DEFAULT NULL,
    -- İade yapılsın mı?
    p_refund            BOOLEAN DEFAULT FALSE,
    p_refund_account_id UUID DEFAULT NULL,
    -- İade muhasebesi için
    p_category_id       UUID DEFAULT NULL,
    p_student_name      TEXT DEFAULT 'Öğrenci'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_fee_status        TEXT;
    v_fee_student_id    UUID;
    v_refunded_amount   NUMERIC := 0;
    v_reason_text       TEXT;
BEGIN
    -- RLS Güvenlik Kontrolü (Yetki Atlatmayı Önlemek İçin)
    IF p_organization_id::text != (auth.jwt()->>'organization_id')::text THEN
        RAISE EXCEPTION 'Yetkisiz işlem: organizasyon_id uyuşmazlığı tespit edildi.';
    END IF;

    -- ---- 1. Ücret kaydını doğrula ----
    SELECT status, student_id
    INTO v_fee_status, v_fee_student_id
    FROM student_fees
    WHERE id = p_fee_id
      AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Ücret kaydı bulunamadı.');
    END IF;

    IF v_fee_status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bu ücret zaten iptal edilmiş.');
    END IF;

    -- ---- 2. Bekleyen / kısmi taksitleri iptal et ----
    UPDATE fee_installments
    SET
        status     = 'cancelled',
        updated_at = now()
    WHERE fee_id = p_fee_id
      AND status NOT IN ('paid', 'cancelled');

    -- ---- 3. İade işlemi (opsiyonel) ----
    IF p_refund AND p_refund_account_id IS NOT NULL AND p_category_id IS NOT NULL THEN
        -- Ödenen toplam tutarı hesapla (PAID taksitlerden)
        SELECT COALESCE(SUM(fp.amount), 0)
        INTO v_refunded_amount
        FROM fee_payments fp
        JOIN fee_installments fi ON fi.id = fp.installment_id
        WHERE fi.fee_id = p_fee_id;

        IF v_refunded_amount > 0 THEN
            v_reason_text := COALESCE(
                NULLIF(p_reason, ''),
                p_student_name || ' - Ücret iptali iadesi'
            );

            -- İade → muhasebede gider kaydı
            INSERT INTO finance_transactions (
                organization_id,
                account_id,
                category_id,
                type,
                amount,
                subtotal,
                vat_rate,
                vat_amount,
                description,
                transaction_date,
                created_by
            ) VALUES (
                p_organization_id,
                p_refund_account_id,
                p_category_id,
                'expense',
                v_refunded_amount,
                v_refunded_amount, -- KDV yok — iade brüt tutarı
                0,
                0,
                v_reason_text,
                CURRENT_DATE,
                p_cancelled_by
            );
            -- NOT: finance_accounts bakiyesi fn_update_account_balance_on_transaction
            --      trigger'ı tarafından otomatik güncellenir.
        END IF;
    END IF;

    -- ---- 4. student_fees.status = 'cancelled' ----
    UPDATE student_fees
    SET
        status     = 'cancelled',
        notes      = CASE
                         WHEN p_reason IS NOT NULL THEN p_reason
                         ELSE notes
                     END,
        updated_at = now()
    WHERE id = p_fee_id;

    -- ---- Başarılı ----
    RETURN jsonb_build_object(
        'success',          true,
        'refunded_amount',  v_refunded_amount
    );

EXCEPTION
    WHEN OTHERS THEN
        -- PostgreSQL transaction otomatik rollback yapar.
        RETURN jsonb_build_object(
            'success', false,
            'error',   SQLERRM
        );
END;
$$;

-- Fonksiyona yalnızca authenticated kullanıcılar erişebilir
REVOKE ALL ON FUNCTION public.cancel_student_fee_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_student_fee_atomic TO authenticated;
