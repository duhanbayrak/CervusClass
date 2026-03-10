-- ============================================================
-- T4 Düzeltmesi: Finansal Raporlama Optimizasyonları (RPC'ler)
-- ============================================================
-- Amaç: On binlerce satırı Node.js tarafına taşıyıp memory'de (RAM) 
--       hesaplamak (reduce) yerine DB engine üzerinde hesaplamak.
-- ============================================================

-- 1. Finansal Özet Hesaplaması
CREATE OR REPLACE FUNCTION public.get_financial_summary(
    p_org_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_income NUMERIC := 0;
    v_total_income_vat NUMERIC := 0;
    v_total_expense NUMERIC := 0;
    v_total_expense_vat NUMERIC := 0;
    v_collected_amount NUMERIC := 0;
    v_pending_amount NUMERIC := 0;
    v_overdue_amount NUMERIC := 0;
    v_collection_rate NUMERIC := 0;
    v_total_expected NUMERIC := 0;
BEGIN
    -- RLS kontrolü
    IF p_org_id::text != (auth.jwt()->>'organization_id')::text THEN
        RAISE EXCEPTION 'Yetkisiz işlem: organizasyon_id uyuşmazlığı tespit edildi.';
    END IF;

    -- Gelirler
    SELECT COALESCE(SUM(amount), 0), COALESCE(SUM(vat_amount), 0)
    INTO v_total_income, v_total_income_vat
    FROM finance_transactions
    WHERE organization_id = p_org_id
      AND type = 'income'
      AND deleted_at IS NULL
      AND transaction_date >= p_start_date
      AND transaction_date <= p_end_date;

    -- Giderler
    SELECT COALESCE(SUM(amount), 0), COALESCE(SUM(vat_amount), 0)
    INTO v_total_expense, v_total_expense_vat
    FROM finance_transactions
    WHERE organization_id = p_org_id
      AND type = 'expense'
      AND deleted_at IS NULL
      AND transaction_date >= p_start_date
      AND transaction_date <= p_end_date;

    -- Dönem İçindeki Tahsilatlar
    SELECT COALESCE(SUM(amount), 0)
    INTO v_collected_amount
    FROM fee_payments
    WHERE organization_id = p_org_id
      AND payment_date >= p_start_date
      AND payment_date <= p_end_date;

    -- Dönem İçindeki Taksitler (Bekleyen / Gecikmiş)
    SELECT 
        COALESCE(SUM(CASE WHEN (amount - COALESCE(paid_amount,0)) > 0 AND (status = 'overdue' OR (status = 'pending' AND due_date < CURRENT_DATE)) THEN (amount - COALESCE(paid_amount,0)) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN (amount - COALESCE(paid_amount,0)) > 0 AND status = 'pending' AND due_date >= CURRENT_DATE THEN (amount - COALESCE(paid_amount,0)) ELSE 0 END), 0)
    INTO v_overdue_amount, v_pending_amount
    FROM fee_installments
    WHERE organization_id = p_org_id
      AND due_date >= p_start_date
      AND due_date <= p_end_date;

    -- Tahsilat Oranı
    v_total_expected := v_collected_amount + v_pending_amount + v_overdue_amount;
    IF v_total_expected > 0 THEN
        v_collection_rate := ROUND((v_collected_amount / v_total_expected) * 100);
    END IF;

    RETURN jsonb_build_object(
        'total_income', v_total_income,
        'total_income_vat', v_total_income_vat,
        'total_expense', v_total_expense,
        'total_expense_vat', v_total_expense_vat,
        'net_profit', (v_total_income - v_total_expense),
        'net_vat', (v_total_income_vat - v_total_expense_vat),
        'total_vat', (v_total_income_vat + v_total_expense_vat),
        'collected_amount', v_collected_amount,
        'pending_amount', v_pending_amount,
        'overdue_amount', v_overdue_amount,
        'collection_rate', v_collection_rate
    );
END;
$$;

-- 2. Aylık Gelir Gider Trendi
CREATE OR REPLACE FUNCTION public.get_monthly_trends(
    p_org_id UUID,
    p_year INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB := '[]'::jsonb;
BEGIN
    IF p_org_id::text != (auth.jwt()->>'organization_id')::text THEN
        RAISE EXCEPTION 'Yetkisiz işlem: organizasyon_id uyuşmazlığı tespit edildi.';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'month', m.month_key,
            'income', COALESCE(t.income, 0),
            'expense', COALESCE(t.expense, 0)
        ) ORDER BY m.month_key
    ) INTO v_result
    FROM (
        SELECT to_char(make_date(p_year, i, 1), 'YYYY-MM') as month_key
        FROM generate_series(1, 12) i
    ) m
    LEFT JOIN (
        SELECT 
            to_char(transaction_date, 'YYYY-MM') as month_key,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM finance_transactions
        WHERE organization_id = p_org_id
          AND deleted_at IS NULL
          AND EXTRACT(YEAR FROM transaction_date) = p_year
        GROUP BY to_char(transaction_date, 'YYYY-MM')
    ) t ON m.month_key = t.month_key;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 3. Kategori Dağılımı
CREATE OR REPLACE FUNCTION public.get_category_distribution(
    p_org_id UUID,
    p_type TEXT,
    p_start_date DATE,
    p_end_date DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_grand_total NUMERIC;
BEGIN
    IF p_org_id::text != (auth.jwt()->>'organization_id')::text THEN
        RAISE EXCEPTION 'Yetkisiz işlem: organizasyon_id uyuşmazlığı tespit edildi.';
    END IF;

    -- Toplam miktar
    SELECT COALESCE(SUM(amount), 0) INTO v_grand_total
    FROM finance_transactions
    WHERE organization_id = p_org_id
      AND type = p_type
      AND deleted_at IS NULL
      AND transaction_date >= p_start_date
      AND transaction_date <= p_end_date;

    IF v_grand_total = 0 THEN
        RETURN '[]'::jsonb;
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'category_name', COALESCE(c.name, 'Bilinmeyen'),
            'category_icon', c.icon,
            'amount', t.total_amount,
            'percentage', ROUND((t.total_amount / v_grand_total) * 100)
        ) ORDER BY t.total_amount DESC
    ), '[]'::jsonb) INTO v_result
    FROM (
        SELECT category_id, SUM(amount) as total_amount
        FROM finance_transactions
        WHERE organization_id = p_org_id
          AND type = p_type
          AND deleted_at IS NULL
          AND transaction_date >= p_start_date
          AND transaction_date <= p_end_date
        GROUP BY category_id
    ) t
    LEFT JOIN finance_categories c ON t.category_id = c.id;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_financial_summary FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_financial_summary TO authenticated;

REVOKE ALL ON FUNCTION public.get_monthly_trends FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_monthly_trends TO authenticated;

REVOKE ALL ON FUNCTION public.get_category_distribution FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_category_distribution TO authenticated;
