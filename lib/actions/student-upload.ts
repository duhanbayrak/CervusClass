'use server'

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { getAuthContext } from '@/lib/auth-context';
import { getUserRole } from '@/lib/auth-helpers';
import { Profile } from '@/types/database';

// Admin client for user management (Service Role)
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

type StudentRow = {
    'Ad Soyad': string
    'Email': string
    'Sınıf': string
    'Parola'?: string
    'Öğrenci No'?: string
    'Öğrenci Telefon'?: string
    'Veli Adı'?: string
    'Veli Telefon'?: string
    'Doğum Tarihi'?: string
}

export async function uploadStudents(prevState: { message: string; success: boolean } | null, formData: FormData) {
    try {
        // 1. Auth Check
        const { supabase, user, organizationId, error } = await getAuthContext();
        if (error || !user || !organizationId) {
            return { message: error || 'Oturum açmanız gerekiyor.', success: false };
        }



        // ...

        // Rol kontrolü — sadece admin yükleyebilir
        const { data: profileWithRole } = await supabase
            .from('profiles')
            .select('organization_id, roles(name)')
            .eq('id', user.id)
            .single();

        const roleName = getUserRole(profileWithRole as unknown as Profile);
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return { message: 'Server configuration error', success: false };
        }

        if (!profileWithRole || (roleName !== 'admin' && roleName !== 'super_admin')) {
            return { message: 'Sadece yöneticiler öğrenci yükleyebilir.', success: false };
        }

        const organization_id = organizationId;

        // 2. Parse File
        const file = formData.get('file') as File;
        if (!file) {
            return { message: 'Dosya seçilmedi.', success: false };
        }

        const buffer = await file.arrayBuffer();
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<StudentRow>(worksheet);

        if (jsonData.length === 0) {
            return { message: 'Dosya boş.', success: false };
        }

        // 3. Pre-fetch Data
        const { data: classes } = await supabase
            .from('classes')
            .select('id, name')
            .eq('organization_id', organization_id);

        // Normalize class names for matching
        const classMap = new Map(classes?.map(c => [c.name.trim().toLowerCase(), c.id]));

        // Get Student Role ID
        const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'student').single();
        const studentRoleId = roleData?.id;

        if (!studentRoleId) {
            return { message: 'Sistem hatası: Öğrenci rolü bulunamadı.', success: false };
        }

        // Collect all emails to pre-fetch existing profiles
        const emails = jsonData.map(row => {
            const raw = (row as any)['Email'];
            return typeof raw === 'string' ? raw.trim() : '';
        }).filter(e => e.length > 0);

        // Pre-fetch existing profiles
        const { data: existingProfiles } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .in('email', emails);

        const existingProfileMap = new Map(existingProfiles?.map(p => [p.email!.toLowerCase(), p.id]));

        const errors: string[] = [];
        let successCount = 0;
        const profilesToUpsert: any[] = [];

        // Concurrency limit for Auth calls could be added here if needed, 
        // strictly keeping sequential for safety against rate limits for now.

        for (let i = 0; i < jsonData.length; i++) {
            const rowResult = await processStudentRow(
                jsonData[i], i + 2, organization_id, studentRoleId,
                classMap, existingProfileMap
            )
            if (rowResult.error) { errors.push(rowResult.error); continue }
            if (rowResult.profile) profilesToUpsert.push(rowResult.profile)
        }

        // 4. Batch Upsert Profiles
        if (profilesToUpsert.length > 0) {
            const { error: batchError } = await supabaseAdmin
                .from('profiles')
                .upsert(profilesToUpsert);

            if (batchError) {
                return { message: 'Toplu profil güncellenirken hata oluştu: ' + batchError.message, success: false };
            }
            successCount = profilesToUpsert.length;
        }

        revalidatePath('/admin/students');

        if (errors.length > 0) {
            const limitErrors = errors.slice(0, 10);
            const remain = errors.length - 10;
            return {
                message: `${successCount} öğrenci eklendi/güncellendi.\n\nHatalar:\n${limitErrors.join('\n')}${remain > 0 ? `\n...ve ${remain} hata daha.` : ''}`,
                success: successCount > 0
            };
        }

        return { message: `${successCount} öğrenci başarıyla yüklendi.`, success: true };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
        return { message: 'Beklenmeyen bir hata oluştu: ' + message, success: false };
    }
}

function normalizeRow(row: unknown): Record<string, unknown> {
    const normalized: Record<string, unknown> = {}
    Object.keys(row as Record<string, unknown>).forEach(key => {
        normalized[key.trim()] = (row as Record<string, unknown>)[key]
    })
    return normalized
}

function extractStudentFields(row: unknown) {
    const r = normalizeRow(row)
    const fullNameVal = r['Ad Soyad']
    const emailVal = r['Email']
    const classNameVal = r['Sınıf']
    const passwordVal = r['Parola']
    return {
        fullName: (typeof fullNameVal === 'string' || typeof fullNameVal === 'number') ? String(fullNameVal).trim() : undefined,
        email: typeof emailVal === 'string' ? String(emailVal).trim() : undefined,
        className: (typeof classNameVal === 'string' || typeof classNameVal === 'number') ? String(classNameVal).trim() : undefined,
        password: (typeof passwordVal === 'string' || typeof passwordVal === 'number') ? String(passwordVal).trim() : '123456',
        studentNumber: r['Öğrenci No'] ? String(r['Öğrenci No']).trim() : undefined,
        phone: r['Öğrenci Telefon'] ? String(r['Öğrenci Telefon']).trim() : undefined,
        parentName: r['Veli Adı'] ? String(r['Veli Adı']).trim() : undefined,
        parentPhone: r['Veli Telefon'] ? String(r['Veli Telefon']).trim() : undefined,
        birthDate: r['Doğum Tarihi'] ? String(r['Doğum Tarihi']).trim() : undefined,
    }
}

async function processStudentRow(
    row: unknown,
    rowIndex: number,
    organizationId: string,
    studentRoleId: string,
    classMap: Map<string, string>,
    existingProfileMap: Map<string, string>
): Promise<{ error?: string; profile?: Record<string, unknown> }> {
    const { fullName, email, className, password, studentNumber, phone, parentName, parentPhone, birthDate } = extractStudentFields(row)

    if (!fullName || !email || !className) return { error: `Satır ${rowIndex}: Eksik bilgi (Ad Soyad, Email veya Sınıf)` }

    const classId = classMap.get(className.toLowerCase())
    if (!classId) return { error: `Satır ${rowIndex}: Sınıf bulunamadı (${className})` }

    let userId = existingProfileMap.get(email.toLowerCase())

    if (!userId) {
        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email, password, email_confirm: true,
            user_metadata: { full_name: fullName, organization_id: organizationId }
        })
        if (createError) {
            if (createError.message.includes('already registered')) return { error: `Satır ${rowIndex}: Kullanıcı Auth'da var ama Profil tablosunda bulunamadı.` }
            return { error: `Satır ${rowIndex}: Kullanıcı oluşturulamadı (${createError.message})` }
        }
        userId = createdUser.user.id
    }

    if (!userId) return { error: `Satır ${rowIndex}: Kullanıcı ID alınamadı.` }

    return {
        profile: {
            id: userId, organization_id: organizationId, full_name: fullName, email,
            class_id: classId, role_id: studentRoleId,
            student_number: studentNumber || null, phone: phone || null,
            parent_name: parentName || null, parent_phone: parentPhone || null,
            birth_date: birthDate || null, updated_at: new Date().toISOString(),
        }
    }
}
