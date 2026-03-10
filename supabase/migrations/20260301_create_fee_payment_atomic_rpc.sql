-- ============================================================
-- T1 Düzeltmesi: Atomik Taksit Ödeme RPC Fonksiyonu
-- ============================================================
-- Amaç: fee_payments INSERT + finance_transactions INSERT +
--        fee_installments UPDATE + student_fees tamamlanma kontrolü
--        işlemlerini tek bir PostgreSQL transaction içinde yapar.
--        Böylece herhangi bir adımda hata olursa tüm işlem geri alınır.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_fee_payment_atomic(
    -- Ödeme bilgileri
    p_organization_id   UUID,
    p_student_id        UUID,
    p_installment_id    UUID,       -- NULL olabilir (taksitsiz ödeme)
    p_account_id        UUID,
    p_amount            NUMERIC,
    p_payment_method    TEXT,
    p_reference_no      TEXT,
    p_notes             TEXT,
    p_payment_date      DATE,
    p_created_by        UUID,
    -- Muhasebe kaydı için
    p_category_id       UUID,
    p_student_name      TEXT,
    -- KDV bilgileri (taksit üzerinden hesaplanmış)
    p_vat_rate          NUMERIC DEFAULT 0,
    p_subtotal          NUMERIC DEFAULT NULL,
    p_vat_amount        NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_id        UUID;
    v_remaining         NUMERIC;
    v_new_paid_amount   NUMERIC;
    v_new_status        TEXT;
    v_fee_id            UUID;
    v_all_paid          BOOLEAN;
    v_subtotal          NUMERIC;
    v_description       TEXT;

    C_SUCCESS           CONSTANT TEXT := 'success';
    C_ERROR             CONSTANT TEXT := 'error';
BEGIN
    -- ---- 0. Security (RLS) Kontrolü ----
    IF p_organization_id::text != (auth.jwt()->>'organization_id')::text THEN
        RAISE EXCEPTION 'Yetkisiz işlem: organizasyon_id uyuşmazlığı tespit edildi.';
    END IF;

    -- ---- 1. Taksit mevcut ve yeterli alan var mı kontrol ----
    IF p_installment_id IS NOT NULL THEN
        SELECT
            (amount - COALESCE(paid_amount, 0)),
            fee_id
        INTO v_remaining, v_fee_id
        FROM fee_installments
        WHERE id = p_installment_id
          AND organization_id = p_organization_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(C_SUCCESS, false, C_ERROR, 'Taksit kaydı bulunamadı.');
        END IF;

        IF p_amount > v_remaining THEN
            RETURN jsonb_build_object(
                C_SUCCESS, false,
                C_ERROR, format(
                    'Tahsilat tutarı aşımı! Bu taksit için en fazla %s ödeme alınabilir.',
                    to_char(v_remaining, 'FM999G999G990D00')
                )
            );
        END IF;
    END IF;

    -- ---- 2. fee_payments INSERT ----
    INSERT INTO fee_payments (
        organization_id,
        student_id,
        installment_id,
        account_id,
        amount,
        payment_method,
        reference_no,
        notes,
        created_by,
        payment_date
    ) VALUES (
        p_organization_id,
        p_student_id,
        p_installment_id,
        p_account_id,
        p_amount,
        p_payment_method,
        p_reference_no,
        p_notes,
        p_created_by,
        p_payment_date
    )
    RETURNING id INTO v_payment_id;

    -- ---- 3. finance_transactions INSERT (muhasebe gelir kaydı) ----
    v_subtotal := COALESCE(p_subtotal, p_amount);
    v_description := COALESCE(
        NULLIF(p_notes, ''),
        p_student_name || ' - Taksit ödemesi'
    );

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
        reference_no,
        related_payment_id,
        created_by
    ) VALUES (
        p_organization_id,
        p_account_id,
        p_category_id,
        'income',
        p_amount,
        v_subtotal,
        p_vat_rate,
        p_vat_amount,
        v_description,
        p_payment_date,
        p_reference_no,
        v_payment_id,
        p_created_by
    );
    -- NOT: finance_accounts bakiyesi fn_update_account_balance_on_transaction trigger'ı
    --      tarafından otomatik güncellenir. Manuel işlem gerekmez.

    -- ---- 4. fee_installments güncelle (taksitli ödemeyse) ----
    IF p_installment_id IS NOT NULL THEN
        SELECT COALESCE(paid_amount, 0) + p_amount
        INTO v_new_paid_amount
        FROM fee_installments
        WHERE id = p_installment_id;

        -- Taksit durumunu belirle
        v_new_status := CASE
            WHEN v_new_paid_amount >= (SELECT amount FROM fee_installments WHERE id = p_installment_id)
            THEN 'paid'
            ELSE 'partial'
        END;

        UPDATE fee_installments
        SET
            paid_amount = v_new_paid_amount,
            status      = v_new_status,
            paid_at     = CASE WHEN v_new_status = 'paid' THEN now() ELSE NULL END
        WHERE id = p_installment_id;

        -- ---- 5. Tüm taksitler ödendi mi? (student_fees tamamlanma kontrolü) ----
        IF v_fee_id IS NOT NULL THEN
            SELECT NOT EXISTS (
                SELECT 1
                FROM fee_installments
                WHERE fee_id = v_fee_id
                  AND status != 'paid'
                  AND status != 'cancelled'
            )
            INTO v_all_paid;

            IF v_all_paid THEN
                UPDATE student_fees
                SET
                    status     = 'completed',
                    updated_at = now()
                WHERE id = v_fee_id;
            END IF;
        END IF;
    END IF;

    -- ---- Başarılı ----
    RETURN jsonb_build_object(
        C_SUCCESS,    true,
        'payment_id', v_payment_id
    );

EXCEPTION
    WHEN OTHERS THEN
        -- PostgreSQL transaction zaten otomatik rollback yapar.
        RETURN jsonb_build_object(
            C_SUCCESS, false,
            C_ERROR,   SQLERRM
        );
END;
$$;

-- Fonksiyona yalnızca authenticated kullanıcılar erişebilir
REVOKE ALL ON FUNCTION public.create_fee_payment_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_fee_payment_atomic TO authenticated;
