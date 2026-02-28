-- Geçmişe Dönük Kasa Bakiyelerini Düzenleme (Backfill)
-- Trigger devreye girmeden önce, sistemdeki mevcut bakiyeleri
-- sadece silinmemiş (deleted_at IS NULL) hareketlere dayanarak yeniden hatasız (atomic) hesaplar.
UPDATE finance_accounts fa -- nosonar: intentional full-table backfill migration, WHERE clause is not required here.
SET balance = COALESCE(fa.initial_balance, 0) + COALESCE(
  (
    SELECT SUM(
      CASE 
        WHEN ft.type = 'income' THEN ft.amount 
        ELSE -ft.amount 
      END
    )
    FROM finance_transactions ft
    WHERE ft.account_id = fa.id AND ft.deleted_at IS NULL
  ), 0
);
