-- NOSONAR
-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- Mevcut fee_payments kayıtlarını finance_transactions tablosuna aktarma
-- Bu migration bir kerelik çalıştırılmalıdır.

-- 1. "Öğrenci Ücreti" gelir kategorisini yoksa oluştur
INSERT INTO finance_categories (organization_id, name, type, icon) -- NOSONAR
SELECT DISTINCT fp.organization_id, 'Öğrenci Ücreti', 'income', '🎓'
FROM fee_payments fp
LEFT JOIN finance_transactions ft ON ft.related_payment_id = fp.id
WHERE ft.id IS NULL;
