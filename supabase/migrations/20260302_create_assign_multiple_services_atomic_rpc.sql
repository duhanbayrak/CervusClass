-- ============================================================
-- T2 Düzeltmesi: Atomik Çoklu Hizmet Atama RPC Fonksiyonu
-- ============================================================
-- Amaç: Öğrenciye atanan tüm paketlerin (student_fees, fee_installments, fee_payments)
--       tek bir transaction'da işlenmesi. Herhangi bir adımda bir hata çıkarsa
--       tüm işlemler otomatik olarak PostgreSQL tarafından Rollback edilir.
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_multiple_services_atomic(
    p_organization_id   UUID,
    p_student_id        UUID,
    p_class_id          UUID,
    p_academic_period   TEXT,
    p_created_by        UUID,
    p_services          JSONB  -- JSON array of services
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_service           JSONB;
    v_unit_price        NUMERIC;
    v_discount_amount   NUMERIC;
    v_discount_type     TEXT;
    v_discount_reason   TEXT;
    v_vat_rate          NUMERIC;
    v_down_payment      NUMERIC;
    v_down_payment_acc  UUID;
    v_installment_count INT;
    v_start_month       TEXT;
    v_payment_due_day   INT;
    
    v_net_amount        NUMERIC;
    v_vat_amount        NUMERIC;
    v_total_with_vat    NUMERIC;
    v_main_inst_count   INT;
    
    v_fee_id            UUID;
    v_next_num          INT;
    v_remaining_amount  NUMERIC;
    v_amount_per_inst   NUMERIC;
    v_inst_amount       NUMERIC;
    v_sum_of_base       NUMERIC;
    v_last_amount       NUMERIC;
    
    v_start_year        INT;
    v_start_month_idx   INT;
    v_due_year          INT;
    v_due_month         INT;
    v_due_date          DATE;
    
    v_dp_installment_id UUID;
    v_category_id       UUID;
    v_student_name      TEXT;

    C_SUCCESS           CONSTANT TEXT := 'success';
    C_ERROR             CONSTANT TEXT := 'error';
    C_INCOME            CONSTANT TEXT := 'income';
    C_CATEGORY_NAME     CONSTANT TEXT := 'Öğrenci Ücreti';
BEGIN
    -- ---- 0. Security (RLS) Kontrolü ----
    IF p_organization_id::text != (auth.jwt()->>'organization_id')::text THEN
        RAISE EXCEPTION 'Yetkisiz işlem: organizasyon_id uyuşmazlığı tespit edildi.';
    END IF;

    -- ---- 1. Gerekli Bilgileri Hazırla ----
    -- Öğrenci ismini al (Description için)
    SELECT full_name INTO v_student_name FROM profiles WHERE id = p_student_id AND organization_id = p_organization_id;
    IF v_student_name IS NULL THEN v_student_name := 'Öğrenci'; END IF;

    -- Muhasebe kategorisi ID'si (Eğer downpayment varsa kullanılacak, yoksa dinamik yaratamayız çünkü RPC içi. Mevcutu almalıyız.)
    -- Bu fonksiyon dışarıda bir TypeScript yardımcı ile halledilebilir ama biz burada basitçe select yapıyoruz.
    SELECT id INTO v_category_id 
    FROM finance_categories 
    WHERE organization_id = p_organization_id AND name = C_CATEGORY_NAME AND type = C_INCOME
    LIMIT 1;

    -- Eğer bulunamadıysa insert edelim (RPC içinde yapılabilir)
    IF v_category_id IS NULL THEN
        INSERT INTO finance_categories (organization_id, name, type, icon)
        VALUES (p_organization_id, C_CATEGORY_NAME, C_INCOME, '🎓')
        RETURNING id INTO v_category_id;
    END IF;

    -- ---- 2. Her Bir Servis İçin İşlem Yap ----
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
    LOOP
        v_unit_price       := COALESCE((v_service->>'unitPrice')::NUMERIC, 0);
        v_discount_amount  := COALESCE((v_service->>'discountAmount')::NUMERIC, 0);
        v_discount_type    := COALESCE(v_service->>'discountType', 'fixed');
        v_discount_reason  := v_service->>'discountReason';
        v_vat_rate         := COALESCE((v_service->>'vatRate')::NUMERIC, 0);
        v_down_payment     := COALESCE((v_service->>'downPayment')::NUMERIC, 0);
        v_down_payment_acc := NULLIF(v_service->>'downPaymentAccountId', '')::UUID;
        v_installment_count:= COALESCE((v_service->>'installmentCount')::INT, 1);
        v_start_month      := v_service->>'startMonth';
        v_payment_due_day  := COALESCE((v_service->>'paymentDueDay')::INT, 1);

        -- Hesaplamalar
        IF v_discount_type = 'percentage' THEN
            v_net_amount := v_unit_price - (v_unit_price * (v_discount_amount / 100));
        ELSE
            v_net_amount := v_unit_price - v_discount_amount;
        END IF;

        v_vat_amount := v_net_amount * (v_vat_rate / 100);
        v_total_with_vat := v_net_amount + v_vat_amount;
        
        v_main_inst_count := v_installment_count;
        IF v_main_inst_count <= 0 THEN v_main_inst_count := 1; END IF;

        -- a) student_fees INSERT
        INSERT INTO student_fees (
            organization_id, student_id, class_id, service_id,
            total_amount, discount_amount, discount_type, discount_reason,
            vat_rate, vat_amount, net_amount, installment_count,
            academic_period, status
        ) VALUES (
            p_organization_id, p_student_id, p_class_id, (v_service->>'serviceId')::UUID,
            v_unit_price, v_discount_amount, v_discount_type, v_discount_reason,
            v_vat_rate, v_vat_amount, v_net_amount, v_main_inst_count,
            p_academic_period, 'active'
        ) RETURNING id INTO v_fee_id;

        -- b) Peşinat (Down Payment) Kaydı
        v_next_num := 1;
        IF v_down_payment > 0 THEN
            IF v_down_payment_acc IS NULL THEN
                RAISE EXCEPTION 'Peşinat için kasa/banka hesabı seçilmedi.';
            END IF;

            INSERT INTO fee_installments (
                fee_id, organization_id, installment_number, amount,
                due_date, status, paid_amount, paid_at
            ) VALUES (
                v_fee_id, p_organization_id, v_next_num, v_down_payment,
                CURRENT_DATE, 'paid', v_down_payment, now()
            ) RETURNING id INTO v_dp_installment_id;
            
            v_next_num := v_next_num + 1;

            -- Peşinat fee_payments ve finance_transactions kayıtları
            INSERT INTO fee_payments (
                organization_id, student_id, installment_id, account_id,
                amount, payment_method, reference_no, created_by, payment_date
            ) VALUES (
                p_organization_id, p_student_id, v_dp_installment_id, v_down_payment_acc,
                v_down_payment, 'cash', 'PESINAT-' || UPPER(LEFT(v_fee_id::text, 6)), p_created_by, CURRENT_DATE
            );

            INSERT INTO finance_transactions (
                organization_id, account_id, category_id, service_id,
                type, amount, subtotal, vat_rate, vat_amount,
                description, transaction_date, created_by
            ) VALUES (
                p_organization_id, v_down_payment_acc, v_category_id, (v_service->>'serviceId')::UUID,
                C_INCOME, v_down_payment, 
                CASE WHEN v_vat_rate > 0 THEN ROUND((v_down_payment / (1 + v_vat_rate / 100)), 2) ELSE v_down_payment END,
                v_vat_rate,
                CASE WHEN v_vat_rate > 0 THEN ROUND((v_down_payment - ROUND((v_down_payment / (1 + v_vat_rate / 100)), 2)), 2) ELSE 0 END,
                'Öğrenci Taksit Peşinatı (' || COALESCE(v_service->>'serviceName', 'Hizmet') || ')', CURRENT_DATE, p_created_by
            );
        END IF;

        -- c) Kalan Taksitlerin Hesaplanması ve Eklenmesi
        v_remaining_amount := v_total_with_vat - v_down_payment;
        IF v_remaining_amount > 0 AND v_installment_count > 0 THEN
            
            IF v_installment_count = 1 THEN
                v_amount_per_inst := ROUND(v_remaining_amount, 2);
            ELSE
                v_amount_per_inst := ROUND((v_remaining_amount / v_installment_count), 2);
            END IF;

            v_sum_of_base := v_amount_per_inst * (v_installment_count - 1);
            v_last_amount := ROUND((v_remaining_amount - v_sum_of_base), 2);

            -- Start Month Parse
            v_start_year := EXTRACT(YEAR FROM CURRENT_DATE);
            v_start_month_idx := EXTRACT(MONTH FROM CURRENT_DATE) - 1;
            
            IF v_start_month IS NOT NULL AND v_start_month != '' THEN
                v_start_year := SPLIT_PART(v_start_month, '-', 1)::INT;
                v_start_month_idx := SPLIT_PART(v_start_month, '-', 2)::INT - 1;
            END IF;

            FOR i IN 0..(v_installment_count - 1) LOOP
                v_due_month := v_start_month_idx + i;
                v_due_year := v_start_year;
                
                IF v_due_month > 11 THEN
                    v_due_year := v_due_year + (v_due_month / 12);
                    v_due_month := v_due_month % 12;
                END IF;
                
                -- Geçerli tarih oluştur (Örn: ayın 31'i çeken, ama due_month şubatsa 28'e yuvarlaması için basitleştirme)
                -- Ay gün kontrolünü atlatmak için basit bir tarih hesaplaması:
                BEGIN
                    v_due_date := (v_due_year::TEXT || '-' || LPAD((v_due_month + 1)::TEXT, 2, '0') || '-' || LPAD(v_payment_due_day::TEXT, 2, '0'))::DATE;
                EXCEPTION WHEN OTHERS THEN
                    -- Eğer geçersiz bir gün girildiyse (örn Şubat 30), ayın ilk gününe ayarla
                    v_due_date := (v_due_year::TEXT || '-' || LPAD((v_due_month + 1)::TEXT, 2, '0') || '-01')::DATE;
                END;

                IF i = (v_installment_count - 1) THEN
                    v_inst_amount := v_last_amount;
                ELSE
                    v_inst_amount := v_amount_per_inst;
                END IF;

                INSERT INTO fee_installments (
                    fee_id, organization_id, installment_number, amount,
                    due_date, status, paid_amount
                ) VALUES (
                    v_fee_id, p_organization_id, v_next_num, v_inst_amount,
                    v_due_date, 'pending', 0
                );
                v_next_num := v_next_num + 1;
            END LOOP;
        END IF;

    END LOOP;

    RETURN jsonb_build_object(C_SUCCESS, true);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(C_SUCCESS, false, C_ERROR, SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.assign_multiple_services_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_multiple_services_atomic TO authenticated;
