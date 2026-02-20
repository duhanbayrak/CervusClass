'use server'

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth-context";

// Admin client - Auth API (kullanıcı oluşturma) ve Rol bypass için gerekli
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export type RegistrationFormData = {
    // 1. Kişisel Bilgiler
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    studentNumber?: string;
    birthDate?: string;

    // Veli Bilgileri
    parentName?: string;
    parentPhone?: string;

    // 2. Akademik Yerleştirme
    classId: string;

    // 3. Finansal Bilgiler
    academicPeriod: string;
    totalAmount: number;
    discountAmount: number;
    discountType?: 'percentage' | 'fixed';
    discountReason?: string;

    downPayment: number;
    downPaymentAccountId?: string;

    installmentCount: number;
    startMonth?: string; // Örn: "2026-09"
    paymentDueDay: number; // Örn: 5
};

export async function registerStudent(data: RegistrationFormData) {
    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !organizationId || !user) return { success: false, error: error || "Unauthorized" };

    // Yetki Kontrolü
    const userRole = user.app_metadata?.role || user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return { success: false, error: "Bu işlem için yetkiniz bulunmamaktadır." };
    }

    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const rollbackActions: Array<() => Promise<void>> = [];
    let newUserId: string | null = null;
    let feeId: string | null = null;

    try {
        // Öğrenci rolünü bul
        const { data: role } = await supabaseAdmin
            .from('roles')
            .select('id')
            .eq('name', 'student')
            .single();

        if (!role) throw new Error("Öğrenci rolü (student) sistemde tanımlı değil.");

        // ==========================================
        // 1. KULLANICI OLUŞTURMA (Auth)
        // ==========================================
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.studentNumber || 'cervus123', // Default parola öğrenci no veya standart parola
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'student',
                organization_id: organizationId
            }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                throw new Error("Bu e-posta adresi sistemde zaten kayıtlı.");
            }
            throw new Error(`Kullanıcı oluşturulamadı: ${authError.message}`);
        }

        newUserId = authData.user.id;

        // Hata durumunda Auth User silinecek
        rollbackActions.push(async () => {
            if (newUserId) {
                await supabaseAdmin.auth.admin.deleteUser(newUserId);
            }
        });

        // ==========================================
        // 2. PROFİL OLUŞTURMA
        // ==========================================
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: newUserId,
                full_name: fullName,
                email: data.email,
                class_id: data.classId,
                phone: data.phone || null,
                student_number: data.studentNumber || null,
                parent_name: data.parentName || null,
                parent_phone: data.parentPhone || null,
                birth_date: data.birthDate || null,
                organization_id: organizationId,
                role_id: role.id
            });

        if (profileError) throw new Error(`Profil oluşturulamadı: ${profileError.message}`);

        // Profil manuel silinme rollback'i (cascade silmezse diye önlem)
        rollbackActions.push(async () => {
            await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
        });

        // ==========================================
        // 3. SINIF KAYDI BÜTÜNLÜĞÜ (Opsiyonel class_students tablosu varsa)
        // class_id profilde tutuluyor, bu nedenle standart sistemde yeterli.
        // İhtiyaç varsa buraya class_students insert'ü eklenebilir.
        // ==========================================


        // ==========================================
        // 4. FİNANSAL ÜCRET TANIMI (student_fees)
        // ==========================================
        const netAmount = data.discountType === 'percentage'
            ? data.totalAmount - (data.totalAmount * ((data.discountAmount || 0) / 100))
            : data.totalAmount - (data.discountAmount || 0);

        // Toplam taksit planına eklenecek taksit sayısı (Peşinat varsa +1 taksit olarak sayılacak ama fee planı ana taksit sayısını tutar)
        // Sistemdeki mevcut mantıkta fee planı taksit sayısını "kalan taksitler" veya "toplam taksitler" görebiliriz.
        // Toplam taksit mantığı üzerinden ilerleyelim. Peşinat varsa (taksit ödemesi gibi işlenir).
        const hasDownPayment = data.downPayment > 0;
        const mainInstallmentCount = data.installmentCount > 0 ? data.installmentCount : 1;

        const { data: feeData, error: feeError } = await supabaseAdmin
            .from('student_fees')
            .insert({
                organization_id: organizationId,
                student_id: newUserId,
                class_id: data.classId,
                total_amount: data.totalAmount,
                discount_amount: data.discountAmount || 0,
                discount_type: data.discountType || null,
                discount_reason: data.discountReason || null,
                net_amount: netAmount,
                installment_count: hasDownPayment ? mainInstallmentCount + 1 : mainInstallmentCount,
                academic_period: data.academicPeriod,
                status: 'active'
            })
            .select()
            .single();

        if (feeError) throw new Error(`Ücret planı oluşturulamadı: ${feeError.message}`);
        feeId = feeData.id;

        rollbackActions.push(async () => {
            if (feeId) {
                await supabaseAdmin.from('student_fees').delete().eq('id', feeId);
            }
        });

        // ==========================================
        // 5. TAKSİT VE PEŞİNAT PLANI
        // ==========================================
        const installmentsToInsert = [];
        let currentInstallmentNumber = 1;
        const remainingAmount = netAmount - (data.downPayment || 0);

        // A) Peşinat (Varsa)
        if (hasDownPayment) {
            if (!data.downPaymentAccountId) throw new Error("Peşinat için kasa/banka hesabı seçilmedi.");

            installmentsToInsert.push({
                fee_id: feeId,
                organization_id: organizationId,
                installment_number: currentInstallmentNumber,
                amount: data.downPayment,
                due_date: new Date().toISOString().split('T')[0], // Bugün
                status: 'paid', // Peşinat doğrudan ödendi sayılır
                paid_amount: data.downPayment,
                paid_at: new Date().toISOString()
            });
            currentInstallmentNumber++;
        }

        // B) Geri Kalan Taksitler
        if (remainingAmount > 0 && data.installmentCount > 0) {
            const amountPerInstallment = parseFloat((remainingAmount / data.installmentCount).toFixed(2));

            let startYear = new Date().getFullYear();
            let startMonthIndex = new Date().getMonth();

            if (data.startMonth) { // Örn: "2026-09"
                const parts = data.startMonth.split('-');
                startYear = parseInt(parts[0]);
                startMonthIndex = parseInt(parts[1]) - 1;
            }

            for (let i = 0; i < data.installmentCount; i++) {
                // Taksit son ödeme tarihini hesapla (örn: her ayın X. günü)
                let dueMonth = startMonthIndex + i;
                let dueYear = startYear;
                if (dueMonth > 11) {
                    dueMonth = dueMonth % 12;
                    dueYear += Math.floor((startMonthIndex + i) / 12);
                }

                // Ayın son gününü aşmamak için kontrol (Örn: Şubat 31 olmaz)
                const daysInMonth = new Date(dueYear, dueMonth + 1, 0).getDate();
                const safeDueDay = Math.min(data.paymentDueDay || 5, daysInMonth);

                const dueDateStr = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}-${String(safeDueDay).padStart(2, '0')}`;

                installmentsToInsert.push({
                    fee_id: feeId,
                    organization_id: organizationId,
                    installment_number: currentInstallmentNumber++,
                    amount: amountPerInstallment,
                    due_date: dueDateStr,
                    status: 'pending',
                    paid_amount: 0,
                    paid_at: null
                });
            }
        }

        if (installmentsToInsert.length > 0) {
            const { data: insertedInstallments, error: installmentError } = await supabaseAdmin
                .from('fee_installments')
                .insert(installmentsToInsert)
                .select();

            if (installmentError) throw new Error(`Taksit planı kaydedilemedi: ${installmentError.message}`);

            // Eğer peşinat varsa, fee_payments tablosuna aktarıp Kasa bakiyesini artır
            if (hasDownPayment && insertedInstallments) {
                const downPaymentInstallment = insertedInstallments.find(i => i.installment_number === 1);
                if (downPaymentInstallment) {
                    const { error: paymentError } = await supabaseAdmin
                        .from('fee_payments')
                        .insert({
                            organization_id: organizationId,
                            student_id: newUserId,
                            installment_id: downPaymentInstallment.id,
                            account_id: data.downPaymentAccountId,
                            amount: data.downPayment,
                            payment_method: 'cash', // Peşinatın genelde nakit/kredi olduğunu varsayarak (formda eklenebilir)
                            notes: "Kayıt Peşinatı",
                            created_by: user.id,
                            payment_date: new Date().toISOString()
                        });

                    if (paymentError) throw new Error(`Peşinat ödemesi kaydedilemedi: ${paymentError.message}`);

                    // Kasa Bakiyesini artır
                    const { data: account } = await supabaseAdmin
                        .from('finance_accounts')
                        .select('balance')
                        .eq('id', data.downPaymentAccountId)
                        .single();

                    if (account) {
                        await supabaseAdmin
                            .from('finance_accounts')
                            .update({ balance: Number(account.balance) + Number(data.downPayment) })
                            .eq('id', data.downPaymentAccountId);
                    }
                }
            }
        }

        revalidatePath('/admin/students');
        revalidatePath('/admin/accounting/students');
        return { success: true, message: "Kayıt başarıyla tamamlandı.", userId: newUserId };

    } catch (err: any) {
        console.error("Öğrenci Kayıt Hatası - İşlem İptal Ediliyor:", err.message);

        // ROLLBACK
        for (let i = rollbackActions.length - 1; i >= 0; i--) {
            try {
                await rollbackActions[i]();
            } catch (rollbackErr) {
                console.error("Rollback failed:", rollbackErr);
            }
        }

        return { success: false, error: err.message || "Kayıt sırasında beklenmeyen bir hata oluştu." };
    }
}
