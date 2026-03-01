-- NOSONAR
-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL migration files
-- Mevcut fee_payments kayıtlarını finance_transactions tablosuna aktarma
-- Bu migration bir kerelik çalıştırılmalıdır.

-- 1. "Öğrenci Ücreti" gelir kategorisini yoksa oluştur
INSERT INTO finance_categories (organization_id, name, type, icon) -- NOSONAR
SELECT DISTINCT fp.organization_id, 'Öğrenci Ücreti', 'income', '🎓'
FROM fee_payments fp
WHERE NOT EXISTS (
    SELECT 1 FROM finance_categories fc
    WHERE fc.organization_id = fp.organization_id
      AND fc.name = 'Öğrenci Ücreti'
      AND fc.type = 'income'
);

-- 2. Mevcut fee_payments kayıtlarını finance_transactions tablosuna aktar
-- (Daha önce aktarılmamış olanlar — related_payment_id ile kontrol)
INSERT INTO finance_transactions (
    organization_id,
    account_id,
    category_id,
    type,
    amount,
    description,
    transaction_date,
    reference_no,
    related_payment_id,
    created_by
)
SELECT
    fp.organization_id,
    fp.account_id,
    fc.id AS category_id,
    'income' AS type,
    fp.amount,
    COALESCE(p.full_name, 'Öğrenci') || ' - ' || COALESCE(fp.notes, 'Taksit ödemesi') AS description,
    fp.payment_date AS transaction_date,
    fp.reference_no,
    fp.id AS related_payment_id,
    fp.created_by
FROM fee_payments fp
JOIN finance_categories fc
    ON fc.organization_id = fp.organization_id
   AND fc.name = 'Öğrenci Ücreti'
   AND fc.type = 'income'
LEFT JOIN profiles p ON p.id = fp.student_id
WHERE NOT EXISTS (
    SELECT 1 FROM finance_transactions ft
    WHERE ft.related_payment_id = fp.id
);
