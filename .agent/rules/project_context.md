# 🎓 Cervus Labs - Dershane Operasyon & Etüt Yönetim Sistemi (SaaS)

## 1. Proje Kimliği ve Mimari Strateji

**Proje:** Dershane ve Etüt Merkezleri için Operasyonel Yönetim Platformu.
**Model:** B2B SaaS (Software as a Service) - Multi-Tenant.
**Mimari:** Single Database, Logical Isolation (Row Level Security).
**Temel Değer:** Finansal süreçlerden ziyade; akademik başarı, yoklama takibi, etüt verimliliği ve öğrenci koçluğuna odaklanır.

### SaaS Altyapısı (Multi-Tenancy)

- **Veri İzolasyonu:** Tüm müşteriler (Dershaneler) tek bir Supabase projesinde tutulur. Veriler `organization_id` kolonu ile ayrıştırılır ve **RLS (Row Level Security)** politikalarıyla korunur.
- **Erişim:** Kurumlar kendilerine özel subdomainlerden giriş yapar (örn: `final.cervuslabs.com`). Next.js Middleware, subdomaini algılayıp `organization_id`yi belirler.

---

## 2. Kullanıcı Rolleri ve Modüller (RBAC)

Sistemde **Super Admin** (Platform Sahibi), **Organization Admin** (Kurum Müdürü), **Teacher** (Öğretmen) ve **Student** (Öğrenci) rolleri bulunur.

### A. Öğrenci Portali

_Hedef: Akademik durumu izleme ve bireysel etüt planlama._

1.  **Dashboard:**
    - Son deneme sınavı netleri.
    - Yaklaşan etütler ve tamamlanmamış ödev uyarıları.
2.  **Akademik Sıralama (Rank Sistemi):**
    - **Logic:** Öğrenci, sadece **kendi kurumundaki** ve **kendi sınıf seviyesindeki** (Örn: 12. Sınıf) öğrenciler arasındaki sıralamasını görür.
    - Genel ve ders bazlı net dağılım grafikleri.
3.  **Etüt Randevu Sistemi:**
    - Öğretmenlerin uygunluk (slot) durumuna göre randevu talep etme.
4.  **Ödev & Sonuçlar:**
    - Atanan ödevleri görüntüleme.
    - Deneme sınavı karnelerine erişim.

### B. Öğretmen Portali

_Hedef: Sınıf yönetimi, yoklama ve zaman planlaması._

1.  **İstatistikler:**
    - Sınıf listeleri ve öğrenci detaylarına erişim.
    - Öğrenci bazlı akademik gelişim grafiklerini görüntüleme.
2.  **Etüt Yönetimi (Availability):**
    - Takvim üzerinde "Boş Slot" (Müsaitlik) oluşturma.
    - Gelen öğrenci taleplerini Onaylama/Reddetme.
    - **Hibrit Takvim:** Sabit ders programını ve dinamik etüt randevularını tek ekranda görme.
3.  **Yoklama Modülü:**
    - Ders bazlı hızlı yoklama.
    - Durumlar: Geldi / Gelmedi / Geç Kaldı (Dakika logu ile).
4.  **Ödev Yönetimi:**
    - Sınıfa veya seçili öğrencilere ödev atama.

### C. Yönetici Portali (Organization Admin)

_Hedef: Kurumsal operasyon ve kullanıcı yönetimi._

1.  **Kullanıcı Yönetimi:**
    - Öğretmen ve Öğrenci Ekleme/Çıkarma (Tekil veya Excel Import ile).
    - Öğrenciye sınıf ataması yapma ve sınıf değişikliği yönetimi.
2.  **Sınıf Yönetimi:**
    - Yeni sınıf oluşturma (Örn: 12-A Sayısal, Mezun-EA).
3.  **Duyuru & İletişim:**
    - Kurum içi duyuru panosu.
    - **SMS/Mail Gönderimi:** Öğretmen veya öğrenci gruplarına toplu bildirim (n8n tetikleyicisi).
4.  **Raporlar:**
    - Kurum geneli deneme ortalamaları.
    - Öğretmen performans raporları (Verilen etüt saati vb.).

### D. Super Admin (Platform Sahibi)

1.  **Tenant Yönetimi:** Yeni dershane (Organization) oluşturma, logo yükleme, üyelik durumunu (Aktif/Pasif) yönetme.

---

## 3. Veritabanı Şeması (Supabase)

⚠️ **Kritik:** Tüm tablolarda `organization_id` alanı zorunludur.

### `organizations` (Tenants)

- `id` (UUID), `name`, `slug` (subdomain), `logo_url`, `subscription_status`

### `profiles` (Kullanıcılar)

- `id` (Auth ID), `organization_id` (FK), `role` (admin, teacher, student, super_admin), `full_name`, `avatar_url`, `class_id` (FK - sadece öğrenciler için)

### `classes` (Sınıflar)

- `id`, `organization_id`, `name` (12-A), `grade_level` (11, 12, Mezun)

### `schedule` (Ders Programı)

- `id`, `organization_id`, `class_id`, `teacher_id`, `course_id`, `day_of_week`, `start_time`, `end_time`

### `study_sessions` (Etütler & Randevular)

- `id`, `organization_id`
- `teacher_id` (FK), `student_id` (FK)
- `scheduled_at` (Tarih/Saat), `status` (pending, approved, rejected, completed, no_show)
- `topic` (Çalışılacak konu)

### `exam_results` (Deneme Sonuçları)

- `id`, `organization_id`
- `student_id` (FK)
- `exam_name`, `exam_date`
- `scores` (JSONB): `{"mat": 30, "fiz": 5, ...}`
- `total_net` (Sıralama için indexli)

### `attendance` (Yoklama)

- `id`, `organization_id`, `student_id`, `schedule_id`, `status`, `date`, `late_minutes`

### `homework` (Ödevler)

- `id`, `organization_id`, `teacher_id`, `class_id`, `description`, `due_date`, `completion_status` (JSONB)

---

## 4. Kritik Algoritmalar ve Logic

### Rank (Sıralama) Algoritması

Sıralama hesaplanırken veritabanı seviyesinde şu filtreler uygulanır:

1.  **Tenant Isolation:** Sadece mevcut `organization_id` verileri.
2.  **Grade Filtering:** Sadece öğrencinin `grade_level`'ındaki (Örn: 12. sınıflar) diğer öğrenciler.
3.  **Calculation:** `exam_results` tablosundaki son sınavın `total_net` değerine göre `RANK()` window fonksiyonu kullanılır.

### Müsaitlik (Availability) Kontrolü

Öğretmen slot açarken veya öğrenci randevu alırken:

- Sistem, öğretmenin `schedule` (Sabit Ders) tablosunu VE `study_sessions` (Onaylı Randevu) tablosunu kontrol eder. Çakışma varsa işlem engellenir.

---

## 5. Otomasyon Akışları (n8n - Multi-Tenant)

Tüm otomasyonlar "Tenant-Aware" çalışır. Tetiklendiğinde hangi kurum için çalıştığını bilir.

1.  **Mola Kaçağı Bildirimi:**
    - _Trigger:_ Öğrenci gün içinde 2. kez derse geç kalırsa.
    - _Action:_ İlgili kurumun Rehberlik/Yönetim kanalına bildirim.
2.  **Etüt Hatırlatması:**
    - _Trigger:_ Randevu saatine 2 saat kala.
    - _Action:_ Öğrenciye Push Notification veya SMS.
3.  **Haftalık Veli Özeti:**
    - _Trigger:_ Pazar 20:00.
    - _Action:_ Kurum bazlı döngü ile öğrencilerin devamsızlık ve ödev özetlerini velilere SMS/Mail at.

---

## 6. Teknoloji Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript
- **UI Library:** Shadcn/UI, Tailwind CSS
- **Charts:** Recharts (Analiz grafikleri için)
- **Backend:** Supabase (Postgres, Auth, Realtime)
- **Security:** Row Level Security (RLS) Policies
- **Workflow:** n8n (Self-hosted)