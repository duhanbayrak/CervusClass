-- Multi-tenant Performance Indexes
-- Bu dosya, tüm temel sorgularda (Row Level Security dahil) sıkça kullanılan
-- organization_id alanı için birleşik endeksler (composite indexes) oluşturur.
-- SPİKY TRAFFİC senaryolarında CPU ve Seq Scan (Sıralı Tarama) sorunlarını engeller.

-- 1. Profiles (Kullanıcı Profilleri Tablosu)
CREATE INDEX IF NOT EXISTS idx_profiles_org_role ON public.profiles(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_org_class ON public.profiles(organization_id, class_id);

-- 2. Finance Transactions (Muhasebe İşlemleri)
CREATE INDEX IF NOT EXISTS idx_finance_transactions_org_date ON public.finance_transactions(organization_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_org_type ON public.finance_transactions(organization_id, type);

-- 3. Student Fees ve Installments (Öğrenci Taksit ve Ücretleri)
CREATE INDEX IF NOT EXISTS idx_student_fees_org_status ON public.student_fees(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_fee_installments_org_status_due ON public.fee_installments(organization_id, status, due_date);

-- 4. Attendance (Yoklama Tablosu)
CREATE INDEX IF NOT EXISTS idx_attendance_org_date ON public.attendance(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_org_schedule ON public.attendance(organization_id, schedule_id);

-- 5. Exams (Sınav Sonuçları Tablosu)
CREATE INDEX IF NOT EXISTS idx_exam_results_org_name ON public.exam_results(organization_id, exam_name);

-- 6. Schedule ve Sessions (Ders Programı ve Etütler)
CREATE INDEX IF NOT EXISTS idx_schedule_org_teacher ON public.schedule(organization_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedule_org_class ON public.schedule(organization_id, class_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_org_status ON public.study_sessions(organization_id, status);

-- 7. Homework (Ödevler)
CREATE INDEX IF NOT EXISTS idx_homework_org_class ON public.homework(organization_id, class_id);
CREATE INDEX IF NOT EXISTS idx_homework_org_teacher ON public.homework(organization_id, teacher_id);

-- 8. Notifications (Bildirimler - Yüksek okuma yükü alacak)
CREATE INDEX IF NOT EXISTS idx_notifications_org_created ON public.notifications(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_reads_org_user ON public.notification_reads(user_id);
