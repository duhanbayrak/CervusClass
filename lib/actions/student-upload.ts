'use server'

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { getAuthContext } from '@/lib/auth-context';
import { getUserRole } from '@/lib/auth-helpers';
import { Profile } from '@/types/database';

// Admin client for user management (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // NOSONAR
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // NOSONAR
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

async function parseStudentFile(formData: FormData): Promise<{ jsonData: StudentRow[] } | { error: string }> {
    const file = formData.get('file') as File;
    if (!file) return { error: 'Dosya seçilmedi.' };
    const buffer = await file.arrayBuffer();
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<StudentRow>(worksheet);
    if (jsonData.length === 0) return { error: 'Dosya boş.' };
    return { jsonData };
}

async function prefetchUploadData(
    supabase: SupabaseClient,
    organizationId: string,
    emails: string[]
): Promise<{ classMap: Map<string, string>; studentRoleId: string; existingProfileMap: Map<string, string> } | { error: string }> {
    const [{ data: classes }, { data: roleData }] = await Promise.all([
        supabase.from('classes').select('id, name').eq('organization_id', organizationId),
        supabase.from('roles').select('id').eq('name', 'student').single(),
    ]);
    if (!roleData?.id) return { error: 'Sistem hatası: Öğrenci rolü bulunamadı.' };
    const { data: existingProfiles } = await supabaseAdmin.from('profiles').select('id, email').in('email', emails);
    return {
        classMap: new Map(classes?.map(c => [c.name.trim().toLowerCase(), c.id])),
        studentRoleId: roleData.id,
        existingProfileMap: new Map(existingProfiles?.map(p => [p.email!.toLowerCase(), p.id])),
    };
}

function buildUploadResult(successCount: number, errors: string[]): { message: string; success: boolean } {
    if (errors.length > 0) {
        const limitErrors = errors.slice(0, 10);
        const remain = errors.length - 10;
        return {
            message: `${successCount} öğrenci eklendi/güncellendi.\n\nHatalar:\n${limitErrors.join('\n')}${remain > 0 ? '\n...ve ' + remain + ' hata daha.' : ''}`,
            success: successCount > 0
        };
    }
    return { message: `${successCount} öğrenci başarıyla yüklendi.`, success: true };
}

async function processAllStudentRows(
    jsonData: StudentRow[],
    organizationId: string,
    studentRoleId: string,
    classMap: Map<string, string>,
    existingProfileMap: Map<string, string>
): Promise<{ successCount: number; errors: string[] }> {
    const errors: string[] = [];
    const profilesToUpsert: Record<string, unknown>[] = [];

    for (let i = 0; i < jsonData.length; i++) {
        const rowResult = await processStudentRow(jsonData[i], i + 2, organizationId, studentRoleId, classMap, existingProfileMap);
        if (rowResult.error) { errors.push(rowResult.error); continue; }
        if (rowResult.profile) profilesToUpsert.push(rowResult.profile);
    }

    if (profilesToUpsert.length === 0) return { successCount: 0, errors };

    const { error: batchError } = await supabaseAdmin.from('profiles').upsert(profilesToUpsert);
    if (batchError) throw new Error('Toplu profil güncellenirken hata oluştu: ' + batchError.message);
    return { successCount: profilesToUpsert.length, errors };
}

export async function uploadStudents(prevState: { message: string; success: boolean } | null, formData: FormData) {
    try {
        const { supabase, user, organizationId, error } = await getAuthContext();
        if (error || !user || !organizationId) {
            return { message: error || 'Oturum açmanız gerekiyor.', success: false };
        }

        const { data: profileWithRole } = await supabase
            .from('profiles').select('organization_id, roles(name)').eq('id', user.id).single();

        const roleName = getUserRole(profileWithRole as unknown as Profile);
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { message: 'Server configuration error', success: false };
        if (!profileWithRole || (roleName !== 'admin' && roleName !== 'super_admin')) {
            return { message: 'Sadece yöneticiler öğrenci yükleyebilir.', success: false };
        }

        const fileResult = await parseStudentFile(formData);
        if ('error' in fileResult) return { message: fileResult.error, success: false };
        const { jsonData } = fileResult;

        const emails = jsonData.map(row => {
            const raw = (row as Record<string, unknown>)['Email'];
            return typeof raw === 'string' ? raw.trim() : '';
        }).filter(e => e.length > 0);

        const prefetchResult = await prefetchUploadData(supabase, organizationId, emails);
        if ('error' in prefetchResult) return { message: prefetchResult.error, success: false };
        const { classMap, studentRoleId, existingProfileMap } = prefetchResult;

        const { successCount, errors } = await processAllStudentRows(jsonData, organizationId, studentRoleId, classMap, existingProfileMap);

        revalidatePath('/admin/students');
        return buildUploadResult(successCount, errors);

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
        studentNumber: (typeof r['Öğrenci No'] === 'string' || typeof r['Öğrenci No'] === 'number') ? String(r['Öğrenci No']).trim() : undefined,
        phone: (typeof r['Öğrenci Telefon'] === 'string' || typeof r['Öğrenci Telefon'] === 'number') ? String(r['Öğrenci Telefon']).trim() : undefined,
        parentName: (typeof r['Veli Adı'] === 'string' || typeof r['Veli Adı'] === 'number') ? String(r['Veli Adı']).trim() : undefined,
        parentPhone: (typeof r['Veli Telefon'] === 'string' || typeof r['Veli Telefon'] === 'number') ? String(r['Veli Telefon']).trim() : undefined,
        birthDate: (typeof r['Doğum Tarihi'] === 'string' || typeof r['Doğum Tarihi'] === 'number') ? String(r['Doğum Tarihi']).trim() : undefined,
    }
}

async function resolveAuthUserId(
    email: string,
    password: string,
    fullName: string,
    organizationId: string,
    existingProfileMap: Map<string, string>,
    rowIndex: number
): Promise<{ userId: string } | { error: string }> {
    const existing = existingProfileMap.get(email.toLowerCase())
    if (existing) return { userId: existing }

    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: fullName, organization_id: organizationId }
    })
    if (createError) {
        if (createError.message.includes('already registered')) {
            return { error: `Satır ${rowIndex}: Kullanıcı Auth'da var ama Profil tablosunda bulunamadı.` }
        }
        return { error: `Satır ${rowIndex}: Kullanıcı oluşturulamadı (${createError.message})` }
    }
    return { userId: createdUser.user.id }
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

    const userResult = await resolveAuthUserId(email, password ?? '123456', fullName, organizationId, existingProfileMap, rowIndex)
    if ('error' in userResult) return { error: userResult.error }

    return {
        profile: {
            id: userResult.userId, organization_id: organizationId, full_name: fullName, email,
            class_id: classId, role_id: studentRoleId,
            student_number: studentNumber || null, phone: phone || null,
            parent_name: parentName || null, parent_phone: parentPhone || null,
            birth_date: birthDate || null, updated_at: new Date().toISOString(),
        }
    }
}
