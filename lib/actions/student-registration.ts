'use server'

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth-context";
import { logger } from "@/lib/logger";
import { format } from "date-fns";

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

export type RegistrationServiceItem = {
    serviceId: string;
    serviceName?: string;
    unitPrice: number;
    vatRate: number;
    discountAmount: number;
    discountType?: 'percentage' | 'fixed';
    discountReason?: string;
    downPayment: number;
    downPaymentAccountId?: string;
    installmentCount: number;
    startMonth?: string;
    paymentDueDay: number;
};

export type RegistrationFormData = {
    // 1. Kişisel Bilgiler
    firstName: string;
    lastName: string;
    email: string;
    tcNo: string;
    studentNumber?: string;
    phone?: string;
    birthDate?: string;

    // Veli Bilgileri
    parentFirstName?: string;
    parentLastName?: string;
    parentPhone?: string;
    parentEmail?: string;
    parentTcNo?: string;
    parentRelationship?: string;
    parentAddress?: string;

    // 2. Akademik Yerleştirme
    classId: string;
    className?: string; // Görüntüleme için

    // 3. Finansal Bilgiler
    academicPeriod: string;
    services: RegistrationServiceItem[];
};

async function resolveStudentNumber(organizationId: string, studentNumber?: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().slice(-2);

    if (studentNumber?.trim()) {
        const { count } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('student_number', studentNumber.trim());
        if (count && count > 0) {
            throw new Error(`"${studentNumber.trim()}" öğrenci numarası bu kurumda zaten kullanımda. Lütfen benzersiz bir numara girin.`);
        }
        return studentNumber.trim();
    }

    const generated = await getNextStudentNumber(organizationId);
    return generated ?? `${yearPrefix}001`;
}

async function createAuthUser(
    email: string,
    password: string,
    fullName: string,
    organizationId: string
): Promise<string> {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: 'student', organization_id: organizationId },
    });
    if (authError) {
        if (authError.message.includes('already registered')) throw new Error("Bu e-posta adresi sistemde zaten kayıtlı.");
        throw new Error(`Kullanıcı oluşturulamadı: ${authError.message}`);
    }
    return authData.user.id;
}

export async function registerStudent(data: RegistrationFormData) {
    const { organizationId, user, error } = await getAuthContext();
    if (error || !organizationId || !user) return { success: false, error: error || "Unauthorized" };

    const userRole = user.app_metadata?.role || user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return { success: false, error: "Bu işlem için yetkiniz bulunmamaktadır." };
    }

    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const rollbackActions: Array<() => Promise<void>> = [];
    let newUserId: string | null = null;

    try {
        const { data: role } = await supabaseAdmin.from('roles').select('id').eq('name', 'student').single();
        if (!role) throw new Error("Öğrenci rolü (student) sistemde tanımlı değil.");

        const finalStudentNumber = await resolveStudentNumber(organizationId, data.studentNumber);

        newUserId = await createAuthUser(data.email, data.tcNo, fullName, organizationId);
        rollbackActions.push(async () => {
            if (newUserId) await supabaseAdmin.auth.admin.deleteUser(newUserId);
        });

        const parentName = (data.parentFirstName || data.parentLastName)
            ? `${data.parentFirstName || ''} ${data.parentLastName || ''}`.trim()
            : null;

        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: newUserId,
            full_name: fullName,
            email: data.email,
            class_id: data.classId,
            tc_no: data.tcNo,
            phone: data.phone || null,
            student_number: finalStudentNumber,
            parent_name: parentName,
            parent_phone: data.parentPhone || null,
            parent_email: data.parentEmail || null,
            parent_tc: data.parentTcNo || null,
            parent_relationship: data.parentRelationship || null,
            parent_address: data.parentAddress || null,
            birth_date: data.birthDate || null,
            organization_id: organizationId,
            role_id: role.id,
        });

        if (profileError) throw new Error(`Profil oluşturulamadı: ${profileError.message}`);
        rollbackActions.push(async () => {
            await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
        });

        for (const service of (data.services || [])) {
            await createServiceFeeAndInstallments({
                client: supabaseAdmin, organizationId, studentId: newUserId!, classId: data.classId,
                academicPeriod: data.academicPeriod, service, userId: user.id, fullName, rollbackActions
            });
        }

        revalidatePath('/admin/students');
        revalidatePath('/admin/accounting/students');
        return { success: true, message: "Kayıt başarıyla tamamlandı.", userId: newUserId };

    } catch (err: unknown) {
        logger.error('Öğrenci kayıt hatası — rollback başlatılıyor', { action: 'registerStudent' }, err);
        for (let i = rollbackActions.length - 1; i >= 0; i--) {
            try { await rollbackActions[i](); }
            catch (rollbackErr) { logger.error('Rollback başarısız', { action: 'registerStudent.rollback' }, rollbackErr); }
        }
        return { success: false, error: err instanceof Error ? err.message : 'Kayıt sırasında beklenmeyen bir hata oluştu.' };
    }
}

// Bir sonraki öğrenci numarasını tahmin eden/öğrenen client-side için server action
export async function getNextStudentNumber(orgId?: string) {
    let organizationId = orgId;
    if (!organizationId) {
        const auth = await getAuthContext();
        organizationId = auth.organizationId;
    }

    if (!organizationId) return null;

    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().slice(-2); //"26"

    const { data: latestStudent } = await supabaseAdmin
        .from('profiles')
        .select('student_number')
        .eq('organization_id', organizationId)
        .ilike('student_number', `${yearPrefix}%`)
        .order('student_number', { ascending: false })
        .limit(1)
        .single();

    let generatedStudentNumber = `${yearPrefix}001`;

    if (latestStudent?.student_number) {
        const currentNumberStr = latestStudent.student_number;
        // 26001 formatını kontrol et
        if (currentNumberStr.length === 5 && currentNumberStr.startsWith(yearPrefix)) {
            const numPart = Number.parseInt(currentNumberStr.slice(2), 10);
            if (!Number.isNaN(numPart)) {
                generatedStudentNumber = `${yearPrefix}${String(numPart + 1).padStart(3, '0')}`;
            }
        }
    }

    return generatedStudentNumber;
}

function buildRegInstallmentRows(
    feeId: string,
    organizationId: string,
    service: RegistrationServiceItem,
    totalAmountWithVat: number,
    startNum: number
): object[] {
    const remainingAmount = totalAmountWithVat - (service.downPayment || 0)
    if (remainingAmount <= 0 || service.installmentCount <= 0) return []

    const amountPerInstallment = Number.parseFloat((remainingAmount / service.installmentCount).toFixed(2))
    const { startYear, startMonthIndex } = parseStartMonthReg(service.startMonth)
    const rows: object[] = []
    let num = startNum

    for (let i = 0; i < service.installmentCount; i++) {
        let dueMonth = startMonthIndex + i
        let dueYear = startYear
        if (dueMonth > 11) { dueYear += Math.floor((startMonthIndex + i) / 12); dueMonth = dueMonth % 12 }
        const daysInMonth = new Date(dueYear, dueMonth + 1, 0).getDate()
        const safeDueDay = Math.min(service.paymentDueDay || 5, daysInMonth)
        const dueDateStr = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}-${String(safeDueDay).padStart(2, '0')}`
        rows.push({
            fee_id: feeId, organization_id: organizationId,
            installment_number: num++, amount: amountPerInstallment,
            due_date: dueDateStr, status: 'pending', paid_amount: 0, paid_at: null,
        })
    }
    return rows
}

function calcRegNetAmount(service: RegistrationServiceItem): { netAmount: number; vatAmount: number; totalAmountWithVat: number } {
    const netAmount = service.discountType === 'percentage'
        ? service.unitPrice - (service.unitPrice * ((service.discountAmount || 0) / 100))
        : service.unitPrice - (service.discountAmount || 0)
    const vatAmount = netAmount * (service.vatRate / 100)
    return { netAmount, vatAmount, totalAmountWithVat: netAmount + vatAmount }
}

interface InsertRegInstallmentsParams {
    client: SupabaseClient;
    feeId: string;
    organizationId: string;
    studentId: string;
    service: RegistrationServiceItem;
    totalAmountWithVat: number;
    userId: string;
    fullName: string;
}

async function insertRegInstallments({
    client, feeId, organizationId, studentId, service, totalAmountWithVat, userId, fullName
}: InsertRegInstallmentsParams): Promise<void> {
    const hasDownPayment = service.downPayment > 0
    const installmentsToInsert: object[] = []
    let nextNum = 1

    if (hasDownPayment) {
        if (!service.downPaymentAccountId) throw new Error(`${service.serviceName || 'Hizmet'} peşinatı için kasa/banka hesabı seçilmedi.`)
        installmentsToInsert.push({
            fee_id: feeId, organization_id: organizationId,
            installment_number: nextNum++, amount: service.downPayment,
            due_date: format(new Date(), 'yyyy-MM-dd'), status: 'paid',
            paid_amount: service.downPayment, paid_at: new Date().toISOString(),
        })
    }

    installmentsToInsert.push(...buildRegInstallmentRows(feeId, organizationId, service, totalAmountWithVat, nextNum))

    if (installmentsToInsert.length === 0) return

    const { data: insertedInstallments, error: installmentError } = await client
        .from('fee_installments').insert(installmentsToInsert).select()
    if (installmentError) throw new Error(`${service.serviceName || 'Hizmet'} taksit planı kaydedilemedi: ${installmentError.message}`)

    if (hasDownPayment && insertedInstallments) {
        const dpInst = insertedInstallments.find(i => i.installment_number === 1)
        if (dpInst) await recordRegistrationDownPayment(client, organizationId, studentId, service, dpInst.id, userId, fullName)
    }
}

interface CreateServiceFeeParams {
    client: SupabaseClient;
    organizationId: string;
    studentId: string;
    classId: string;
    academicPeriod: string;
    service: RegistrationServiceItem;
    userId: string;
    fullName: string;
    rollbackActions: Array<() => Promise<void>>;
}

async function createServiceFeeAndInstallments({
    client, organizationId, studentId, classId, academicPeriod, service, userId, fullName, rollbackActions
}: CreateServiceFeeParams): Promise<string> {
    const { vatAmount, totalAmountWithVat } = calcRegNetAmount(service)
    const hasDownPayment = service.downPayment > 0
    const mainInstallmentCount = service.installmentCount > 0 ? service.installmentCount : 1

    const { data: feeData, error: feeError } = await client
        .from('student_fees')
        .insert({
            organization_id: organizationId,
            student_id: studentId,
            class_id: classId,
            service_id: service.serviceId,
            total_amount: service.unitPrice,
            discount_amount: service.discountAmount || 0,
            discount_type: service.discountType || null,
            discount_reason: service.discountReason || null,
            vat_rate: service.vatRate,
            vat_amount: vatAmount,
            net_amount: totalAmountWithVat,
            installment_count: hasDownPayment ? mainInstallmentCount + 1 : mainInstallmentCount,
            academic_period: academicPeriod,
            status: 'active',
        })
        .select()
        .single()

    if (feeError) throw new Error(`${service.serviceName || 'Hizmet'} planı oluşturulamadı: ${feeError.message}`)
    const feeId = feeData.id
    rollbackActions.push(async () => { await client.from('student_fees').delete().eq('id', feeId) })

    await insertRegInstallments({ client, feeId, organizationId, studentId, service, totalAmountWithVat, userId, fullName })
    return feeId
}

function parseStartMonthReg(startMonth?: string): { startYear: number; startMonthIndex: number } {
    const now = new Date()
    if (!startMonth) return { startYear: now.getFullYear(), startMonthIndex: now.getMonth() }
    const parts = startMonth.split('-')
    return { startYear: Number.parseInt(parts[0]), startMonthIndex: Number.parseInt(parts[1]) - 1 }
}

async function recordRegistrationDownPayment(
    client: SupabaseClient,
    organizationId: string,
    studentId: string,
    service: RegistrationServiceItem,
    installmentId: string,
    userId: string,
    fullName: string
): Promise<void> {
    const { error: paymentError } = await client.from('fee_payments').insert({
        organization_id: organizationId,
        student_id: studentId,
        installment_id: installmentId,
        account_id: service.downPaymentAccountId,
        amount: service.downPayment,
        payment_method: 'cash',
        notes: `${service.serviceName || 'Hizmet'} Kayıt Peşinatı`,
        created_by: userId,
        payment_date: new Date().toISOString(),
    })
    if (paymentError) throw new Error(`Peşinat ödemesi kaydedilemedi: ${paymentError.message}`)

    const { data: existingCat } = await client.from('finance_categories').select('id')
        .eq('organization_id', organizationId).eq('name', 'Öğrenci Ücreti').eq('type', 'income').maybeSingle()
    let catId = existingCat?.id
    if (!catId) {
        const { data: newCat } = await client.from('finance_categories')
            .insert({ organization_id: organizationId, name: 'Öğrenci Ücreti', type: 'income', icon: '🎓' })
            .select('id').single()
        catId = newCat?.id
    }
    if (!catId) return

    await client.from('finance_transactions').insert({
        organization_id: organizationId,
        account_id: service.downPaymentAccountId,
        category_id: catId,
        service_id: service.serviceId,
        subtotal: service.downPayment,
        vat_rate: 0, vat_amount: 0, type: 'income',
        amount: service.downPayment,
        description: `${fullName} - ${service.serviceName || 'Hizmet'} Peşinatı`,
        transaction_date: new Date().toISOString(),
        created_by: userId,
    })
}

export async function checkStudentNumberUnique(studentNumber: string): Promise<boolean> {
    const { supabase, organizationId } = await getAuthContext();
    if (!organizationId || !studentNumber) return false;

    const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('student_number', studentNumber.trim());

    if (error) {
        logger.error('Öğrenci numarası kontrol hatası', { action: 'checkStudentNumberUnique' }, error);
        return false;
    }

    return count === 0;
}
