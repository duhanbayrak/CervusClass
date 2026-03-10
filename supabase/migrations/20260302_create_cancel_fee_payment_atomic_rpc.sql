-- ============================================================
-- T1 Düzeltmesi (Adım 4): Atomik Taksit Ödemesi (Tahsilat) İptali
-- ============================================================
-- Amaç: Sisteme girilmiş bir tahsilat (payment) kaydını geri almak.
--
--        İşlem Adımları:
--        1. fee_payments soft-delete veya delete
--        2. finance_transactions (gelir tablosu) iptali / silinmesi
--        3. fee_installments.paid_amount düşülmesi ve status'un ('paid' -> 'partial/pending') güncellenmesi
--        4. student_fees status'ünün (gerekiyorsa 'completed' -> 'active') güncellenmesi
--        Tüm bu adımlar RACE CONDITION önlemek için tek bir atomik PostgreSQL Transaction içinde gerçekleşir.
-- ============================================================

CREATE OR REPLACE FUNCTION public.cancel_fee_payment_atomic(
    p_payment_id        UUID,
    p_organization_id   UUID,
    p_cancelled_by      UUID,
    p_reason            TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_installment_id    UUID;
    v_payment_amount    NUMERIC;
    v_fee_id            UUID;
    v_new_paid_amount   NUMERIC;
    v_new_status        TEXT;
    v_fee_status        TEXT;
BEGIN
    -- ---- 0. Security (RLS) Kontrolü ----
    IF p_organization_id::text != (auth.jwt()->>'organization_id')::text THEN
        RAISE EXCEPTION 'Yetkisiz işlem: organizasyon_id uyuşmazlığı tespit edildi.';
    END IF;

    -- ---- 1. Tahsilat Kaydını Doğrula ve Bilgilerini Al ----
    SELECT installment_id, amount
    INTO v_installment_id, v_payment_amount
    FROM fee_payments
    WHERE id = p_payment_id
      AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'İptal edilecek tahsilat kaydı bulunamadı.');
    END IF;

    -- ---- 2. Tahsilatı (fee_payments) ve İlgili Muhasebe Kaydını Temizle ----
    -- Mimaride soft delete kullanılıyorsa update, aksi halde delete.
    -- Bu senaryoda doğrudan siliyoruz çünkü yanlış girilmiş bir veri olarak varsayıyoruz.
    DELETE FROM fee_payments
    WHERE id = p_payment_id;

    -- Muhasebe Transaction Silme (Trigger ile finance_accounts bakiyesi güncellenir)
    DELETE FROM finance_transactions
    WHERE related_payment_id = p_payment_id;

    -- ---- 3. fee_installments (Taksit Planı) Güncellemesi ----
    IF v_installment_id IS NOT NULL THEN
        -- Taksitin ait olduğu fee_id ve güncel paid_amount hesaplanıyor
        SELECT
            (COALESCE(paid_amount, 0) - v_payment_amount),
            fee_id
        INTO v_new_paid_amount, v_fee_id
        FROM fee_installments
        WHERE id = v_installment_id;

        -- Negatif bakiye kontrolü
        IF v_new_paid_amount < 0 THEN
            v_new_paid_amount := 0;
        END IF;

        -- Yeni taksit statüsü: Hiç ödeme kalmadıysa pending, biraz kaldıysa partial
        IF v_new_paid_amount = 0 THEN
            v_new_status := 'pending';
        ELSE
            v_new_status := 'partial';
        END IF;

        UPDATE fee_installments
        SET
            paid_amount = v_new_paid_amount,
            status      = v_new_status,
            paid_at     = NULL -- Artık tam ödenmiş kabul edilmiyor
        WHERE id = v_installment_id;

        -- ---- 4. student_fees (Ana Paket) Güncellemesi ----
        IF v_fee_id IS NOT NULL THEN
            -- Ana sözleşme "completed" statüsündeyse, ve artık "pending/partial" taksitler oluştuysa
            -- "active" (devam eden) durumuna geri çevrilmeli.
            SELECT status INTO v_fee_status
            FROM student_fees
            WHERE id = v_fee_id;

            IF v_fee_status = 'completed' THEN
                -- Acaba iptal işlemimiz sonrasında hiç pending/partial taksit oluştu mu?
                IF EXISTS (
                    SELECT 1 FROM fee_installments
                    WHERE fee_id = v_fee_id AND status != 'paid' AND status != 'cancelled'
                ) THEN
                    UPDATE student_fees
                    SET
                        status = 'active',
                        updated_at = now()
                    WHERE id = v_fee_id;
                END IF;
            END IF;
        END IF;
    END IF;

    -- ---- Başarılı Dönüş ----
    RETURN jsonb_build_object('success', true);

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Fonksiyona yalnızca authenticated kullanıcılar erişebilir
REVOKE ALL ON FUNCTION public.cancel_fee_payment_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_fee_payment_atomic TO authenticated;
