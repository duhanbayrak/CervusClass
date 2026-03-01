-- Kasa hesapları (finance_accounts) için bakiye tutarlılık otomasyonu.
-- finance_transactions (işlemler) tablosuna bağlı bir TRIGGER ile bakiyenin atomik (race-condition engelli) şekilde güncellenmesini sağlar.

-- Bakiye değişim yönünü hesaplayan yardımcı fonksiyon
CREATE OR REPLACE FUNCTION public.fn_apply_balance_delta(
    p_account_id UUID,
    p_amount NUMERIC,
    p_type TEXT,
    p_direction INTEGER  -- +1: ekle, -1: çıkar
)
RETURNS VOID AS $$
DECLARE
    v_delta NUMERIC;
BEGIN
    IF p_type = 'income' THEN
        v_delta := p_direction * p_amount;
    ELSIF p_type = 'expense' THEN
        v_delta := -p_direction * p_amount;
    ELSE
        RETURN;
    END IF;
    UPDATE finance_accounts SET balance = balance + v_delta WHERE id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ana trigger fonksiyonu — maksimum 3 seviye nesting
CREATE OR REPLACE FUNCTION public.fn_update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- YENİ KAYIT EKLENDİĞİNDE
    IF TG_OP = 'INSERT' THEN
        PERFORM public.fn_apply_balance_delta(NEW.account_id, NEW.amount, NEW.type, +1);

    -- KAYIT GÜNCELLENDİĞİNDE
    ELSIF TG_OP = 'UPDATE' THEN
        -- Soft-delete: eski etkiyi geri al
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            PERFORM public.fn_apply_balance_delta(OLD.account_id, OLD.amount, OLD.type, -1);

        -- Soft-delete geri alındı (restore): yeni etkiyi uygula
        ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
            PERFORM public.fn_apply_balance_delta(NEW.account_id, NEW.amount, NEW.type, +1);

        -- Normal güncelleme: hesap, miktar veya tür değiştiyse
        ELSIF OLD.deleted_at IS NULL AND NEW.deleted_at IS NULL THEN
            IF OLD.account_id != NEW.account_id OR OLD.amount != NEW.amount OR OLD.type != NEW.type THEN
                PERFORM public.fn_apply_balance_delta(OLD.account_id, OLD.amount, OLD.type, -1);
                PERFORM public.fn_apply_balance_delta(NEW.account_id, NEW.amount, NEW.type, +1);
            END IF;
        END IF;

    -- KAYIT TAMAMEN SİLİNDİĞİNDE (Hard Delete)
    ELSIF TG_OP = 'DELETE' THEN
        -- Soft-delete yapılmamışsa etkiyi geri al (mükerrer kesinti önlenir)
        IF OLD.deleted_at IS NULL THEN
            PERFORM public.fn_apply_balance_delta(OLD.account_id, OLD.amount, OLD.type, -1);
        END IF;
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Her ihtimale karşı varsa önceki trigger silinir
DROP TRIGGER IF EXISTS trg_finance_transactions_balance ON finance_transactions;

-- Tabloya trigger eklenir
CREATE TRIGGER trg_finance_transactions_balance
AFTER INSERT OR UPDATE OR DELETE ON finance_transactions
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_account_balance_on_transaction();
