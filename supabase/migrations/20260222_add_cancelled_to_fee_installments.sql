-- Taksitlerin 'cancelled' (iptal edildi) durumunu alabilmesi için mevcut kısıtlamayı kaldırıp güncel halini ekliyoruz.
ALTER TABLE IF EXISTS public.fee_installments 
DROP CONSTRAINT IF EXISTS fee_installments_status_check;

ALTER TABLE IF EXISTS public.fee_installments 
ADD CONSTRAINT fee_installments_status_check 
CHECK (status IN ('pending', 'paid', 'overdue', 'partial', 'cancelled'));
