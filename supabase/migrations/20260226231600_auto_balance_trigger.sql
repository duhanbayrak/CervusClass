-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- Kasa hesapları (finance_accounts) için bakiye tutarlılık otomasyonu.
-- finance_transactions (işlemler) tablosuna bağlı bir TRIGGER ile bakiyenin atomik (race-condition engelli) şekilde güncellenmesini sağlar.

CREATE OR REPLACE FUNCTION public.fn_update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- YENİ KAYIT EKLENDİĞİNDE
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'income' THEN
            UPDATE finance_accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE finance_accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        END IF;

    -- KAYIT GÜNCELLENDİĞİNDE (Özellikle soft-delete)
    ELSIF TG_OP = 'UPDATE' THEN
        -- Eğer soft-delete edildiyse (deleted_at NULL iken dolu hale gelirse)
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            IF OLD.type = 'income' THEN
                UPDATE finance_accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'expense' THEN
                UPDATE finance_accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            END IF;
        
        -- Eğer soft-delete geri alındıysa (restore)
        ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
            IF NEW.type = 'income' THEN
                UPDATE finance_accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
            ELSIF NEW.type = 'expense' THEN
                UPDATE finance_accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            END IF;
        
        -- Miktar veya hesap veya tür değiştiyse (normal güncelleme)
        ELSIF OLD.deleted_at IS NULL AND NEW.deleted_at IS NULL THEN
            IF OLD.account_id != NEW.account_id OR OLD.amount != NEW.amount OR OLD.type != NEW.type THEN
                -- Eski kaydın etkisini hesaptan geri al
                IF OLD.type = 'income' THEN
                    UPDATE finance_accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
                ELSIF OLD.type = 'expense' THEN
                    UPDATE finance_accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
                END IF;
                -- Yeni kaydın etkisini yeni verilerle entegre et
                IF NEW.type = 'income' THEN
                    UPDATE finance_accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
                ELSIF NEW.type = 'expense' THEN
                    UPDATE finance_accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
                END IF;
            END IF;
        END IF;

    -- KAYIT TAMAMEN SİLİNDİĞİNDE (Hard Delete)
    ELSIF TG_OP = 'DELETE' THEN
        -- Sadece silindiğinde, eğer soft-delete DEĞİLDİYSE etkisini geri al.
        -- Soft delete daha önceden yapılmışsa zaten bakiye trigger update tarafından düşülmüştür, mükerrer kesinti olmasın.
        IF OLD.deleted_at IS NULL THEN
            IF OLD.type = 'income' THEN
                UPDATE finance_accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'expense' THEN
                UPDATE finance_accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            END IF;
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
