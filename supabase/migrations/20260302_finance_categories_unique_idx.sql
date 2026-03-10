-- finance_categories tablosunda aynı isme ve tipe sahip birden fazla kategori olmasını engeller.
-- Eşzamanlı "Öğrenci Ücreti" kategorisi oluşturma isteklerini güvenli hale getirir (T10 gereksinimi).

CREATE UNIQUE INDEX IF NOT EXISTS finance_categories_org_name_type_idx 
ON finance_categories (organization_id, name, type);
