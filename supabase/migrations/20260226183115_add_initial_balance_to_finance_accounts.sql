-- 1. Kasa Bakiyeleri tablosuna 'initial_balance' (Açılış Bakiyesi) eklentisi.
-- Geçmiş sistemden kalan (veri göçü) nakitin hesaplanabilmesi için açılış durumunu tutarız.
ALTER TABLE finance_accounts 
ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(15,2) DEFAULT 0 NOT NULL;

-- 2. Yorum Satırı (Dökümantasyon)
COMMENT ON COLUMN finance_accounts.initial_balance IS 'Sisteme geçiş yapılan andaki veya kasanın açıldığı andaki ilk bakiye miktarıdır.';
