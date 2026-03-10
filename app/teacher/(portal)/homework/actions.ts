'use server'

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createBulkNotifications, createNotification } from '@/lib/actions/notifications';
import { withAction } from '@/lib/actions/utils/with-action';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Süresi dolmuş ödevleri kontrol edip öğretmene bildirim gönder
export const checkExpiredHomework = withAction('homework:check_expired', async (ctx) => {
    const { data: expiredHomework } = await supabaseAdmin
        .from('homework')
        .select('id, description, due_date')
        .eq('teacher_id', ctx.user.id)
        .lt('due_date', new Date().toISOString())
        .is('deleted_at', null);

    if (!expiredHomework || expiredHomework.length === 0) return { success: true };

    const { data: existingNotifications } = await supabaseAdmin
        .from('notifications')
        .select('message')
        .eq('user_id', ctx.user.id)
        .eq('title', 'Ödev Süresi Doldu ⏰');

    const notifiedMessages = new Set(existingNotifications?.map(n => n.message) || []);

    for (const hw of expiredHomework) {
        const msg = `"${hw.description.substring(0, 40)}${hw.description.length > 40 ? '...' : ''}" ödevinin teslim süresi doldu.`;
        if (!notifiedMessages.has(msg)) {
            await createNotification({ userId: ctx.user.id, title: 'Ödev Süresi Doldu ⏰', message: msg, type: 'warning' });
        }
    }

    return { success: true };
});

// Sınıfa göre öğrencileri getir
export const getStudentsByClass = withAction(
    'homework:get_students_by_class',
    z.object({ classId: z.string().uuid() }),
    async ({ classId }, ctx) => {
        const { data, error: dbError } = await ctx.supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('class_id', classId)
            .order('full_name', { ascending: true });

        if (dbError) return { success: false, error: dbError.message };
        return { success: true, data: data || [] };
    }
);

const CreateHomeworkSchema = z.object({
    description: z.string().min(3, 'Açıklama en az 3 karakter olmalıdır.'),
    class_id: z.string().uuid('Geçerli bir sınıf seçiniz.'),
    due_date: z.string().refine((val) => !Number.isNaN(Date.parse(val)), 'Geçerli bir tarih seçiniz.'),
    assignment_mode: z.enum(['entire_class', 'selected_students']),
    assigned_student_ids: z.string().nullable().optional(),
});

export type CreateHomeworkState = {
    errors?: { description?: string[]; class_id?: string[]; due_date?: string[]; _form?: string[] };
    message?: string;
} | undefined;

type SupabaseClient = Awaited<ReturnType<typeof import('@/lib/auth-context').getAuthContext>>['supabase'];

async function resolveTargetStudentIds(
    supabase: SupabaseClient,
    assignment_mode: string,
    studentIdsArray: string[] | null,
    class_id: string
): Promise<string[]> {
    if (assignment_mode === 'selected_students' && studentIdsArray) {
        return studentIdsArray;
    }
    const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'student').single();
    if (!roleData?.id) return [];
    const { data: students } = await supabase.from('profiles').select('id').eq('class_id', class_id).eq('role_id', roleData.id);
    return students?.map(s => s.id) ?? [];
}

async function notifyStudentsAboutHomework(
    studentIds: string[],
    description: string,
    due_date: string
): Promise<void> {
    const dueDateStr = new Date(due_date).toLocaleDateString('tr-TR');
    const shortDesc = description.substring(0, 50) + (description.length > 50 ? '...' : '');
    await createBulkNotifications(studentIds.map(studentId => ({
        userId: studentId,
        title: 'Yeni Ödev 📝',
        message: `Yeni bir ödev tanımlandı: ${shortDesc} (Teslim: ${dueDateStr})`,
        type: 'info' as const,
    })));
}

// FormAction — withAction kullanılamaz (prevState imzası farklı), logger ile korunur
export async function createHomework(prevState: CreateHomeworkState, formData: FormData): Promise<CreateHomeworkState> {
    const { getAuthContext } = await import('@/lib/auth-context');
    const { logger } = await import('@/lib/logger');

    const { supabase, user, organizationId, error: authError } = await getAuthContext();
    if (authError || !user || !organizationId) return { message: authError || 'Oturum bulunamadı.' };

    const validatedFields = CreateHomeworkSchema.safeParse({
        description: formData.get('description'),
        class_id: formData.get('class_id'),
        due_date: formData.get('due_date'),
        assignment_mode: formData.get('assignment_mode'),
        assigned_student_ids: formData.get('assigned_student_ids'),
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: 'Lütfen form alanlarını kontrol ediniz.' };
    }

    const { description, class_id, due_date, assignment_mode, assigned_student_ids } = validatedFields.data;

    try {
        const studentIdsArray = assignment_mode === 'selected_students' && assigned_student_ids
            ? JSON.parse(assigned_student_ids) as string[]
            : null;

        const { data: homeworkData, error } = await supabase
            .from('homework')
            .insert({ description, class_id, teacher_id: user.id, organization_id: organizationId, due_date, assigned_student_ids: studentIdsArray })
            .select()
            .single();

        if (error) return { message: 'Veritabanı hatası: Ödev oluşturulamadı.' };

        const targetStudentIds = await resolveTargetStudentIds(supabase, assignment_mode, studentIdsArray, class_id);

        if (targetStudentIds.length > 0) {
            const { error: submissionError } = await supabase.from('homework_submissions').insert(
                targetStudentIds.map(studentId => ({ homework_id: homeworkData.id, student_id: studentId, organization_id: organizationId, status: 'pending' as const }))
            );

            if (submissionError) {
                logger.warn('Ödev submission oluşturulamadı', { userId: user.id, organizationId, action: 'createHomework' });
            }

            await notifyStudentsAboutHomework(targetStudentIds, description, due_date);
        }

        revalidatePath('/teacher/homework');
        return { message: 'Ödev başarıyla oluşturuldu' };

    } catch (err: unknown) {
        logger.error('Ödev oluşturma hatası', { userId: user.id, organizationId, action: 'createHomework' }, err);
        return { message: 'Beklenmedik bir hata oluştu.' };
    }
}
