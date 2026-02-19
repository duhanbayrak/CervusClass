'use server'

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createBulkNotifications, createNotification } from '@/lib/actions/notifications';
import { getAuthContext } from '@/lib/auth-context';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Süresi dolmuş ödevleri kontrol edip öğretmene bildirim gönder
export async function checkExpiredHomework() {
    try {
        const { user, error } = await getAuthContext();
        if (error || !user) return;

        // Süresi dolmuş ve henüz bildirim gönderilmemiş ödevleri bul
        const { data: expiredHomework } = await supabaseAdmin
            .from('homework')
            .select('id, description, due_date')
            .eq('teacher_id', user.id)
            .lt('due_date', new Date().toISOString())
            .is('deleted_at', null);

        if (!expiredHomework || expiredHomework.length === 0) return;

        // Bu öğretmene zaten gönderilmiş "Ödev Süresi Doldu" bildirimlerini kontrol et
        const { data: existingNotifications } = await supabaseAdmin
            .from('notifications')
            .select('message')
            .eq('user_id', user.id)
            .eq('title', 'Ödev Süresi Doldu ⏰');

        const notifiedMessages = new Set(existingNotifications?.map(n => n.message) || []);

        for (const hw of expiredHomework) {
            const msg = `"${hw.description.substring(0, 40)}${hw.description.length > 40 ? '...' : ''}" ödevinin teslim süresi doldu.`;
            if (!notifiedMessages.has(msg)) {
                await createNotification({
                    userId: user.id,
                    title: 'Ödev Süresi Doldu ⏰',
                    message: msg,
                    type: 'warning',
                });
            }
        }
    } catch {
        // sessizce devam et
    }
}

// Sınıfa göre öğrencileri getir
export async function getStudentsByClass(classId: string) {
    try {
        const { supabase, error } = await getAuthContext();
        if (error) return { data: [], error };

        const { data, error: dbError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('class_id', classId)
            .order('full_name', { ascending: true });

        if (dbError) return { data: [], error: dbError.message };
        return { data: data || [] };
    } catch {
        return { data: [], error: 'Beklenmedik hata' };
    }
}

// Define the validation schema
const CreateHomeworkSchema = z.object({
    description: z.string().min(3, { message: "Açıklama en az 3 karakter olmalıdır." }),
    class_id: z.string().uuid({ message: "Geçerli bir sınıf seçiniz." }),
    due_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Geçerli bir tarih seçiniz." }),
    teacher_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    assignment_mode: z.enum(['entire_class', 'selected_students']),
    assigned_student_ids: z.string().nullable().optional(), // JSON string of student IDs or null
});

export type CreateHomeworkState = {
    errors?: {
        description?: string[];
        class_id?: string[];
        due_date?: string[];
        _form?: string[];
    };
    message?: string;
} | undefined;

export async function createHomework(prevState: CreateHomeworkState, formData: FormData): Promise<CreateHomeworkState> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    // Server Actions usually don't set auth cookies but strict requirement in newer versions
                    /* Middleware handles this, but for safety lets mimic empty set */
                }
            }
        }
    );

    // Validate fields
    const validatedFields = CreateHomeworkSchema.safeParse({
        description: formData.get('description'),
        class_id: formData.get('class_id'),
        due_date: formData.get('due_date'),
        teacher_id: formData.get('teacher_id'),
        organization_id: formData.get('organization_id'),
        assignment_mode: formData.get('assignment_mode'),
        assigned_student_ids: formData.get('assigned_student_ids'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Lütfen form alanlarını kontrol ediniz.',
        };
    }

    const { description, class_id, due_date, teacher_id, organization_id, assignment_mode, assigned_student_ids } = validatedFields.data;

    // Verify auth again for extra security
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== teacher_id) {
        return {
            message: 'Yetkisiz işlem girişimi.',
        }
    }

    try {
        // Prepare assigned_student_ids based on mode
        const studentIdsArray = assignment_mode === 'selected_students' && assigned_student_ids
            ? JSON.parse(assigned_student_ids)
            : null;

        const { data: homeworkData, error } = await supabase
            .from('homework')
            .insert({
                description,
                class_id,
                teacher_id,
                organization_id,
                due_date,
                // completion_status: {}, // REMOVED: Using new table
                assigned_student_ids: studentIdsArray // Keep for reference if needed, or rely on submissions
            })
            .select()
            .single();

        if (error) {

            return {
                message: 'Veritabanı hatası: Ödev oluşturulamadı.',
            };
        }

        // -------------------------------------------------------------
        // NEW: Populate homework_submissions
        // -------------------------------------------------------------
        let targetStudentIds: string[] = [];

        if (assignment_mode === 'selected_students' && studentIdsArray) {
            targetStudentIds = studentIdsArray;
        } else {
            // Fetch all students in the class
            const { data: students, error: studentError } = await supabase
                .from('profiles')
                .select('id')
                .eq('class_id', class_id)
                .eq('role_id', (await supabase.from('roles').select('id').eq('name', 'student').single()).data?.id);

            if (!studentError && students) {
                targetStudentIds = students.map(s => s.id);
            }
        }

        if (targetStudentIds.length > 0) {
            const submissions = targetStudentIds.map(studentId => ({
                homework_id: homeworkData.id,
                student_id: studentId,
                organization_id,
                status: 'pending' // Default status
            }));

            const { error: submissionError } = await supabase
                .from('homework_submissions')
                .insert(submissions);

            if (submissionError) {

                // Non-fatal? Or should we rollback? 
                // For now log it. Next.js creates don't easily rollback unless transaction used (RPC).
            }

            // Öğrencilere bildirim gönder
            const dueDateStr = new Date(due_date).toLocaleDateString('tr-TR');
            const notifications = targetStudentIds.map(studentId => ({
                userId: studentId,
                title: 'Yeni Ödev 📝',
                message: `Yeni bir ödev tanımlandı: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''} (Teslim: ${dueDateStr})`,
                type: 'info' as const,
            }));
            await createBulkNotifications(notifications);
        }


    } catch (error) {
        return {
            message: 'Beklenmedik bir hata oluştu.',
        };
    }

    // If successful:
    revalidatePath('/teacher/homework');
    return { message: 'Ödev başarıyla oluşturuldu' }; // Don't redirect inside try-catch block, return success state or redirect after
}
