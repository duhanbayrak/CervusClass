'use server'

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createBulkNotifications, createNotification } from '@/lib/actions/notifications';
import { withAction } from '@/lib/actions/utils/with-action';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Süresi dolmuş ödevleri kontrol edip öğretmene bildirim gönder
export const checkExpiredHomework = withAction(async (ctx) => {
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
    due_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Geçerli bir tarih seçiniz.'),
    assignment_mode: z.enum(['entire_class', 'selected_students']),
    assigned_student_ids: z.string().nullable().optional(),
});

export type CreateHomeworkState = {
    errors?: { description?: string[]; class_id?: string[]; due_date?: string[]; _form?: string[] };
    message?: string;
} | undefined;

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
            ? JSON.parse(assigned_student_ids)
            : null;

        const { data: homeworkData, error } = await supabase
            .from('homework')
            .insert({ description, class_id, teacher_id: user.id, organization_id: organizationId, due_date, assigned_student_ids: studentIdsArray })
            .select()
            .single();

        if (error) return { message: 'Veritabanı hatası: Ödev oluşturulamadı.' };

        let targetStudentIds: string[] = [];

        if (assignment_mode === 'selected_students' && studentIdsArray) {
            targetStudentIds = studentIdsArray;
        } else {
            const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'student').single();
            if (roleData?.id) {
                const { data: students } = await supabase.from('profiles').select('id').eq('class_id', class_id).eq('role_id', roleData.id);
                if (students) targetStudentIds = students.map(s => s.id);
            }
        }

        if (targetStudentIds.length > 0) {
            const { error: submissionError } = await supabase.from('homework_submissions').insert(
                targetStudentIds.map(studentId => ({ homework_id: homeworkData.id, student_id: studentId, organization_id: organizationId, status: 'pending' as const }))
            );

            if (submissionError) {
                logger.warn('Ödev submission oluşturulamadı', { userId: user.id, organizationId, action: 'createHomework' });
            }

            const dueDateStr = new Date(due_date).toLocaleDateString('tr-TR');
            await createBulkNotifications(targetStudentIds.map(studentId => ({
                userId: studentId,
                title: 'Yeni Ödev 📝',
                message: `Yeni bir ödev tanımlandı: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''} (Teslim: ${dueDateStr})`,
                type: 'info' as const,
            })));
        }

        revalidatePath('/teacher/homework');
        return { message: 'Ödev başarıyla oluşturuldu' };

    } catch (err: unknown) {
        logger.error('Ödev oluşturma hatası', { userId: user.id, organizationId, action: 'createHomework' }, err);
        return { message: 'Beklenmedik bir hata oluştu.' };
    }
}
