'use server'

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import * as XLSX from 'xlsx';
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

        const errors: string[] = [];
        let successCount = 0;

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowIndex = i + 2; // +2 for Header and 0-index

            // Normalize keys
            const normalizedRow: Record<string, unknown> = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.trim()] = (row as Record<string, unknown>)[key];
            });

            const fullNameVal = normalizedRow['Ad Soyad'];
            const fullName = (typeof fullNameVal === 'string' || typeof fullNameVal === 'number') ? String(fullNameVal).trim() : undefined;

            const emailVal = normalizedRow['Email'];
            const email = (typeof emailVal === 'string') ? String(emailVal).trim() : undefined;

            const classNameVal = normalizedRow['Sınıf'];
            const className = (typeof classNameVal === 'string' || typeof classNameVal === 'number') ? String(classNameVal).trim() : undefined;

            const passwordVal = normalizedRow['Parola'];
            const password = (typeof passwordVal === 'string' || typeof passwordVal === 'number') ? String(passwordVal).trim() : '123456';

            const studentNumberVal = normalizedRow['Öğrenci No'];
            const studentNumber = (typeof studentNumberVal === 'string' || typeof studentNumberVal === 'number') ? String(studentNumberVal).trim() : undefined;

            const phoneVal = normalizedRow['Öğrenci Telefon'];
            const phone = (typeof phoneVal === 'string' || typeof phoneVal === 'number') ? String(phoneVal).trim() : undefined;

            const parentNameVal = normalizedRow['Veli Adı'];
            const parentName = (typeof parentNameVal === 'string' || typeof parentNameVal === 'number') ? String(parentNameVal).trim() : undefined;

            const parentPhoneVal = normalizedRow['Veli Telefon'];
            const parentPhone = (typeof parentPhoneVal === 'string' || typeof parentPhoneVal === 'number') ? String(parentPhoneVal).trim() : undefined;

            // Basic date handling
            const birthDateVal = normalizedRow['Doğum Tarihi'];
            const birthDate = (typeof birthDateVal === 'string') ? String(birthDateVal).trim() : undefined;

            if (!fullName || !email || !className) {
                errors.push(`Satır ${rowIndex}: Eksik bilgi (Ad Soyad, Email veya Sınıf)`);
                continue;
            }

            // Resolve Class
            const classId = classMap.get(className.toLowerCase());
            if (!classId) {
                // Optional: Auto-create class? No, sticking to validation for now.
                errors.push(`Satır ${rowIndex}: Sınıf bulunamadı (${className})`);
                continue;
            }

            // Create User (Auth)
            // We use upsert-like behavior: create, catch existing.

            // Check if user exists first? NO, createUser handles it or returns error.
            // But if user exists, we might want to update their profile/class.
            // Admin createUser returns error if email exists.

            let userId = null;

            const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                    organization_id: organization_id
                }
            });

            if (createError) {
                // If user already exists, we find the ID to update profile
                if (createError.message.includes('already registered')) {
                    // Fetch existing user ID by email? 
                    // supabaseAdmin doesn't have getUserByEmail easily exposed in verify context usually?
                    // Actually listUsers or similar?
                    // Or, we can query profiles if we trust consistent email.

                    // Warning: Admin API create shouldn't override password of existing user unless explicit.
                    // We'll skip password update for existing users, just update profile.

                    // Find user ID from profiles table is safer if we can't search Auth easily.
                    const { data: existingProfile } = await supabaseAdmin
                        .from('profiles')
                        .select('id')
                        .eq('email', email)
                        .single();

                    if (existingProfile) {
                        userId = existingProfile.id;
                    } else {
                        errors.push(`Satır ${rowIndex}: Kullanıcı Auth'da kayıtlı ama profili yok (${email}).`);
                        continue;
                    }
                } else {
                    errors.push(`Satır ${rowIndex}: Kullanıcı oluşturulamadı (${createError.message})`);
                    continue;
                }
            } else {
                userId = createdUser.user.id;
            }

            if (userId) {
                // Upsert Profile
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: userId,
                        organization_id: organization_id,
                        full_name: fullName,
                        email: email,
                        class_id: classId,
                        role_id: studentRoleId,
                        student_number: studentNumber || null,
                        phone: phone || null,
                        parent_name: parentName || null,
                        parent_phone: parentPhone || null,
                        birth_date: birthDate || null
                    });

                if (profileError) {
                    errors.push(`Satır ${rowIndex}: Profil güncellenemedi (${profileError.message})`);
                } else {
                    successCount++;
                }
            }
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
