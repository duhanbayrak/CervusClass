# Cervus Class - Kapsamlı Test Senaryoları (Test Cases)

Bu belge, Cervus Class uygulamasının tüm modülleri için detaylı test senaryolarını içerir.

## 1. Kimlik Doğrulama (Authentication) Modülü

Bu modül, tüm kullanıcı tipleri (Admin, Öğretmen, Öğrenci, Süper Admin) için giriş işlemlerini kapsar.

| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-001** | Geçerli Bilgilerle Giriş (Yönetici) | Sistemde kayıtlı bir Yönetici hesabı olmalı | 1. `/admin/login` sayfasına git.<br>2. Geçerli e-posta ve şifre gir.<br>3. 'Giriş Yap' butonuna tıkla. | Başarılı bir şekilde `/admin/dashboard` sayfasına yönlendirilmeli. |
| **AUTH-002** | Geçerli Bilgilerle Giriş (Öğretmen) | Sistemde kayıtlı bir Öğretmen hesabı olmalı | 1. `/teacher/login` sayfasına git.<br>2. Geçerli e-posta ve şifre gir.<br>3. 'Giriş Yap' butonuna tıkla. | Başarılı bir şekilde `/teacher/dashboard` sayfasına yönlendirilmeli. |
| **AUTH-003** | Geçerli Bilgilerle Giriş (Öğrenci) | Sistemde kayıtlı bir Öğrenci hesabı olmalı | 1. `/student/login` sayfasına git.<br>2. Geçerli TC Kimlik No/E-posta ve şifre gir.<br>3. 'Giriş Yap' butonuna tıkla. | Başarılı bir şekilde `/student/dashboard` sayfasına yönlendirilmeli. |
| **AUTH-004** | Geçersiz Şifre ile Giriş Denemesi | Herhangi bir hesap | 1. Giriş sayfasına git.<br>2. Geçerli e-posta, yanlış şifre gir.<br>3. 'Giriş Yap' butonuna tıkla. | Hata mesajı (örn: "E-posta veya şifre hatalı") görüntülenmeli. |
| **AUTH-005** | Kayıtsız Kullanıcı Girişi | Sistemde olmayan hesap | 1. Giriş sayfasına git.<br>2. Rastgele e-posta ve şifre gir.<br>3. 'Giriş Yap' butonuna tıkla. | Hata mesajı (örn: "Kullanıcı bulunamadı") görüntülenmeli. |
| **AUTH-006** | Çıkış Yapma (Logout) | Giriş yapmış kullanıcı | 1. Profil menüsüne tıkla.<br>2. 'Çıkış Yap' seçeneğini seç. | Oturum sonlandırılmalı ve giriş sayfasına yönlendirilmeli. |

## 2. Yönetici (Admin) Modülü

Yöneticilerin, okul/dershane yönetimini sağladığı paneldir.

### 2.1. Dashboard (Panel)
| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **ADM-001** | Dashboard Verilerinin Görüntülenmesi | Admin girişi yapılmış | 1. `/admin/dashboard` sayfasına git.<br>2. İstatistik kartlarını (Öğrenci Sayısı, Öğretmen Sayısı vb.) kontrol et. | Veriler doğru ve güncel olmalı. Hata vermemeli. |

### 2.2. Sınıf Yönetimi (Classes)
| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **ADM-002** | Yeni Sınıf Oluşturma | Admin girişi yapılmış | 1. `/admin/classes` sayfasına git.<br>2. 'Yeni Sınıf Ekle' butonuna tıkla.<br>3. Sınıf Adı, Kapasite vb. gir.<br>4. Kaydet. | Yeni sınıf listede görünmeli. Başarı mesajı alınmalı. |
| **ADM-003** | Sınıf Düzenleme | Mevcut bir sınıf olmalı | 1. Sınıf listesinden bir sınıf seç.<br>2. 'Düzenle' butonuna tıkla.<br>3. Bilgileri değiştir ve kaydet. | Değişiklikler listeye yansımalı. |
| **ADM-004** | Sınıf Silme | Silinecek sınıf, aktif ders içermemeli | 1. Sınıf listesinde 'Sil' butonuna tıkla.<br>2. Onay kutusunu onayla. | Sınıf listeden kaldırılmalı. |

### 2.3. Öğretmen Yönetimi (Teachers)
| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **ADM-005** | Yeni Öğretmen Ekleme | Admin girişi yapılmış | 1. `/admin/teachers` sayfasına git.<br>2. 'Ekle' butonu ile formu aç.<br>3. Ad, Soyad, Branş, E-posta gir.<br>4. Kaydet. | Öğretmen listeye eklenmeli. Giriş bilgileri e-posta olarak gitmeli (veya belirlenmeli). |
| **ADM-006** | Öğretmen Profilini Düzenleme | Mevcut öğretmen | 1. Öğretmen detayına git.<br>2. Bilgileri (Branş, Telefon vb.) güncelle.<br>3. Kaydet. | Profil güncellenmeli. |

### 2.4. Öğrenci Yönetimi (Students)
| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **ADM-007** | Yeni Öğrenci Kaydı | Admin girişi yapılmış | 1. `/admin/students` sayfasına git.<br>2. 'Yeni Öğrenci' butonuna tıkla.<br>3. Kimlik, Ad, Soyad, Veli bilgileri gir.<br>4. Kaydet. | Öğrenci veritabanına eklenmeli. |
| **ADM-008** | Excel ile Toplu Öğrenci Yükleme | Hazır Excel şablonu | 1. Öğrenci sayfasında 'Excel Yükle'ye tıkla.<br>2. Dosyayı seç ve yükle. | Dosyadaki tüm geçerli öğrenciler sisteme eklenmeli. Hatalı satırlar raporlanmalı. |
| **ADM-009** | Öğrenciyi Sınıfa Atama | Kayıtlı öğrenci ve sınıf | 1. Öğrenci detayına git.<br>2. 'Sınıf Ata' seçeneğini kullan.<br>3. Sınıfı seç ve onayla. | Öğrenci ilgili sınıfa bağlanmalı. |

### 2.5. Ders Programı (Schedule)
| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **ADM-010** | Ders Programı Görüntüleme | - | 1. `/admin/schedule` sayfasına git.<br>2. Haftalık/Günlük görünümü kontrol et. | Ders blokları doğru saatlerde ve doğru sınıflarda görünmeli. |
| **ADM-011** | Ders Atama (Slot Ekleme) | Müsait sınıf ve öğretmen | 1. Takvimde boş bir saate tıkla.<br>2. Ders, Öğretmen, Sınıf seç.<br>3. Kaydet. | Programda yeni ders bloğu oluşmalı. Çakışma varsa uyarı vermeli. |

## 3. Öğretmen (Teacher) Modülü

Öğretmenlerin günlük operasyonlarını yürüttüğü paneldir.

### 3.1. Dashboard & Program
| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **TCH-001** | Günlük Dersleri Görüntüleme | Öğretmen girişi | 1. `/teacher/dashboard` sayfasına bak. | O günkü dersler saat sırasına göre listelenmeli. |
| **TCH-002** | Haftalık Program | - | 1. `/teacher/schedule` sayfasına git. | Sadece kendine atanan dersleri görmeli. |

### 3.2. Yoklama (Attendance)
| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **TCH-003** | Yoklama Alma | Aktif bir ders saati | 1. Ders detayına/listesine git.<br>2. 'Yoklama Al' butonuna tıkla.<br>3. Gelmeyen öğrencileri işaretle.<br>4. Kaydet. | Yoklama veritabanına kaydedilmeli. Yönetici bunu görebilmeli. |

### 3.3. Ödev Yönetimi (Homework)
| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **TCH-004** | Ödev Verme | - | 1. `/teacher/homework` sayfasına git.<br>2. 'Yeni Ödev' butonuna tıkla.<br>3. Başlık, Açıklama, Son Teslim Tarihi, Dosya (varsa) seç.<br>4. Sınıfı seç ve Gönder. | İlgili sınıftaki öğrencilere ödev bildirimi düşmeli. |
| **TCH-005** | Ödev Kontrolü | Öğrenciler ödev göndermiş olmalı | 1. Verilen ödevin detayına git.<br>2. Gönderilen ödevleri listele.<br>3. Birine tıkla, incele ve not/yorum ver. | Not sisteme işlenmeli, öğrenci bunu görmeli. |

### 3.4. Etüt Talepleri (Study Requests)
| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **TCH-006** | Etüt Talebi Yönetimi | Öğrenci talep oluşturmuş olmalı | 1. `/teacher/study-requests` sayfasına git.<br>2. Gelen talebi 'Onayla' veya 'Reddet'. | Talep durumu güncellenmeli. |

## 4. Öğrenci (Student) Modülü

Öğrencilerin akademik takibi için kullanılan paneldir.

### 4.1. Akademik Takip
| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **STD-001** | Ders Programı Takibi | Öğrenci girişi yapılmış | 1. `/student/schedule` sayfasına git. | Kendi sınıfının programını eksiksiz görmeli. |
| **STD-002** | Not Görüntüleme | Sınav/Ödev notu girilmiş | 1. `/student/grades` sayfasına git. | Girilen notlar, ders bazında listelenmeli. |

### 4.2. Ödev İşlemleri
| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **STD-003** | Ödev Görüntüleme & Yükleme | Aktif bir ödev olmalı | 1. `/student/homework` sayfasına git.<br>2. Ödev detayına tıkla.<br>3. Dosya yükle veya metin gir.<br>4. 'Gönder' butonuna tıkla. | Ödev başarıyla gönderildi mesajı alınmalı. Yüklenen dosya korunmalı. |

### 4.3. Etüt (Study)
| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **STD-004** | Etüt Talep Etme | Müsait öğretmen | 1. `/student/study-requests` sayfasına git.<br>2. Öğretmen ve Konu seç.<br>3. Talep oluştur. | Talep öğretmenin ekranına düşmeli. |

## 5. Süper Yönetici (Super Admin) Modülü

Tüm organizasyonun üst düzey yönetimi (genellikle sistem sahibi).

| Test ID | Senaryo | Ön Koşullar | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **SADM-001** | Genel Görünüm | Super Admin girişi | 1. `/super-admin/dashboard` sayfasına git. | Tüm okulların/şubelerin genel verilerini görebilmeli. |

## 6. Teknik & Güvenlik Kontrolleri

Bu testler her modül ve sayfa için geçerlidir.

| Test ID | Senaryo | Adımlar | Beklenen Sonuç |
| :--- | :--- | :--- | :--- |
| **SEC-001** | Yetkisiz Erişim (URL Jumping) | 1. Öğrenci hesabıyla giriş yap.<br>2. Tarayıcı adres çubuğuna `/admin/dashboard` yaz.<br>3. Enter'a bas. | Erişim engellenmeli (403/401 hatası) veya anasayfaya yönlendirmeli. |
| **SEC-002** | SQL Injection / XSS Kontrolü | 1. Form alanlarına `<script>alert(1)</script>` gibi girdiler yaz.<br>2. Kaydet. | Sistem girdiyi temizlemeli (sanitize) veya reddetmeli. Kod çalışmamalı. |
| **PERF-001** | Sayfa Yüklenme Hızı | 1. Dashboard gibi veri yoğun sayfalara git. | Sayfa makul bir sürede (örn: <2sn) açılmalı. |
| **RESP-001** | Mobil Uyumluluk | 1. Tarayıcı penceresini mobil boyutuna (375px) küçült.<br>2. Menüleri ve butonları kontrol et. | Tasarım bozulmamalı, tüm butonlar tıklanabilir olmalı. |

---
**Not:** Bu test senaryoları mevcut proje yapısı incelenerek hazırlanmıştır. Yeni özellikler eklendikçe güncellenmelidir.
