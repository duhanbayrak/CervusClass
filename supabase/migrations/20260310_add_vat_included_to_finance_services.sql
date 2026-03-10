-- KDV dahil fiyat girişi tercihini sakla
-- unit_price her zaman KDV hariç net fiyat olarak saklanır.
-- vat_included yalnızca formda doğru checkbox durumunu geri yüklemek için kullanılır.
ALTER TABLE finance_services ADD COLUMN IF NOT EXISTS vat_included boolean NOT NULL DEFAULT false;
