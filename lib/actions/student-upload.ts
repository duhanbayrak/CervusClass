'use server'

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import * as XLSX from 'xlsx';

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

export async function uploadStudents(prevState: any, formData: FormData) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() }
            }
        }
    );

    try {
        // 1. Auth Check (Admin only)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { message: 'Oturum açmanız gerekiyor.', success: false };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, roles(name)')
            .eq('id', user.id)
            .single();

        const roles = profile?.roles as any;
        const roleName = Array.isArray(roles) ? roles[0]?.name : roles?.name;
        if (!profile || (roleName !== 'admin' && roleName !== 'super_admin')) {
            return { message: 'Sadece yöneticiler öğrenci yükleyebilir.', success: false };
        }

        const organization_id = profile.organization_id;

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
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.trim()] = (row as any)[key];
            });

            const fullName = normalizedRow['Ad Soyad']?.toString().trim();
            const email = normalizedRow['Email']?.toString().trim();
            const className = normalizedRow['Sınıf']?.toString().trim();
            const password = normalizedRow['Parola']?.toString().trim() || '123456';
            const studentNumber = normalizedRow['Öğrenci No']?.toString().trim();
            const phone = normalizedRow['Öğrenci Telefon']?.toString().trim();
            const parentName = normalizedRow['Veli Adı']?.toString().trim();
            const parentPhone = normalizedRow['Veli Telefon']?.toString().trim();
            // Basic date handling - assumes string or Excel numeric date if passed
            // For robustness, users should format as Text "YYYY-MM-DD" or similar.
            // Let's take string for now.
            const birthDate = normalizedRow['Doğum Tarihi']?.toString().trim();

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

    } catch (error: any) {
        console.error('Upload Error:', error);
        return { message: 'Beklenmeyen bir hata oluştu: ' + error.message, success: false };
    }
}
