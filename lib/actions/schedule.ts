'use server'

import { z } from 'zod';
import { revalidatePath } from "next/cache";
import { withAction } from "@/lib/actions/utils/with-action";
import { ROLES } from '@/lib/constants'

export type ScheduleFormData = {
    day_of_week: number;
    start_time: string;
    end_time: string;
    course_id: string;
    teacher_id: string;
    class_id: string;
    room_name?: string;
}

const scheduleFormSchema = z.object({
    day_of_week: z.number().int().min(1).max(7),
    start_time: z.string().min(1, 'Başlangıç saati zorunludur.'),
    end_time: z.string().min(1, 'Bitiş saati zorunludur.'),
    course_id: z.string().uuid(),
    teacher_id: z.string().uuid(),
    class_id: z.string().uuid(),
    room_name: z.string().optional(),
});

const revalidateSchedulePaths = () => {
    revalidatePath('/admin/schedule');
    revalidatePath('/teacher/schedule');
    revalidatePath('/student/schedule');
};

// Ders programına yeni öğe ekle
export const addScheduleItem = withAction(scheduleFormSchema, async (formData, ctx) => {
    const role = ctx.user.app_metadata?.role;
    if (role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) {
        return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
    }

    const { data: conflicts, error: conflictError } = await ctx.supabase
        .from('schedule')
        .select('id')
        .eq('teacher_id', formData.teacher_id)
        .eq('day_of_week', formData.day_of_week)
        .lt('start_time', formData.end_time)
        .gt('end_time', formData.start_time);

    if (conflictError) return { success: false, error: 'Çakışma kontrolü yapılamadı.' };
    if (conflicts && conflicts.length > 0) {
        return { success: false, error: 'Seçilen öğretmenin bu saat aralığında başka bir dersi var.' };
    }

    const { error: dbError } = await ctx.supabase
        .from('schedule')
        .insert({ ...formData, organization_id: ctx.organizationId });

    if (dbError) return { success: false, error: dbError.message };

    revalidateSchedulePaths();
    return { success: true };
});

// Ders programı öğesi sil
export const deleteScheduleItem = withAction(
    z.object({ id: z.string().uuid() }),
    async ({ id }, ctx) => {
        const role = ctx.user.app_metadata?.role;
        if (role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) {
            return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
        }

        const { error: dbError } = await ctx.supabase
            .from('schedule')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (dbError) return { success: false, error: dbError.message };

        revalidatePath('/admin/schedule');
        return { success: true };
    }
);

// Ders programı öğesi güncelle
export const updateScheduleItem = withAction(
    z.object({ id: z.string().uuid(), formData: scheduleFormSchema }),
    async ({ id, formData }, ctx) => {
        const role = ctx.user.app_metadata?.role;
        if (role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) {
            return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
        }

        const { error: dbError } = await ctx.supabase
            .from('schedule')
            .update(formData)
            .eq('id', id);

        if (dbError) return { success: false, error: dbError.message };

        revalidateSchedulePaths();
        return { success: true };
    }
);

// Tüm ders programını sil
export const deleteAllSchedule = withAction(async (ctx) => {
    const role = ctx.user.app_metadata?.role;
    if (role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) {
        return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
    }

    const { error: dbError } = await ctx.supabase
        .from('schedule')
        .update({ deleted_at: new Date().toISOString() })
        .eq('organization_id', ctx.organizationId);

    if (dbError) return { success: false, error: dbError.message };

    revalidateSchedulePaths();
    return { success: true };
});

const DAYS_MAP: Record<string, number> = {
    'Pazartesi': 1, 'Salı': 2, 'Çarşamba': 3, 'Perşembe': 4, 'Cuma': 5, 'Cumartesi': 6, 'Pazar': 7,
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7,
}

function parseTime(timeStr: string | number): string | null {
    if (!timeStr) return null;
    if (typeof timeStr === 'number') {
        const totalSeconds = Math.round(timeStr * 86400);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
    if (typeof timeStr === 'string') {
        const normalizedTime = timeStr.replace('.', ':');
        const parts = normalizedTime.split(':');
        if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
        }
    }
    return null;
}

const ScheduleRowSchema = z.object({
    'Sınıf Adı': z.union([z.string(), z.number()]).transform(String),
    'Gün': z.union([z.string(), z.number()]).transform(String),
    'Başlangıç Saati': z.union([z.string(), z.number()]),
    'Bitiş Saati': z.union([z.string(), z.number()]),
    'Ders Adı': z.union([z.string(), z.number()]).transform(String),
    'Öğretmen Email': z.string().optional(),
    'Öğretmen Maili': z.string().optional(),
    'Ders Kodu': z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : ''),
    'Oda': z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : ''),
}).refine(data => data['Öğretmen Email'] || data['Öğretmen Maili'], {
    message: 'Öğretmen Email is required',
    path: ['Öğretmen Email'],
});

// Excel'den ders programı yükle — FormAction olduğu için withAction kullanılamaz, logger ile korunur
export async function uploadSchedule(prevState: unknown, formData: FormData) {
    const { getAuthContext } = await import('@/lib/auth-context');
    const { logger } = await import('@/lib/logger');
    const XLSX = await import('xlsx');

    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !user || !organizationId) return { message: error || 'Unauthorized', success: false };

    const role = user.app_metadata?.role;
    if (role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) {
        return { message: 'Sadece yöneticiler ders programı yükleyebilir.', success: false };
    }

    try {
        const file = formData.get('file') as File;
        if (!file) return { message: 'Dosya seçilmedi.', success: false };

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) return { message: 'Dosya boş.', success: false };

        const parsedRows: { rowIndex: number; data: ReturnType<typeof ScheduleRowSchema.parse> }[] = [];
        const errors: string[] = [];

        for (let i = 0; i < jsonData.length; i++) {
            const result = ScheduleRowSchema.safeParse(jsonData[i]);
            if (!result.success) {
                const errorMsg = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                errors.push(`Satır ${i + 2}: Geçersiz veri (${errorMsg})`);
                continue;
            }
            parsedRows.push({ rowIndex: i + 2, data: result.data });
        }

        if (errors.length > 0) {
            return { message: errors.slice(0, 10).join('\n') + (errors.length > 10 ? `... ve ${errors.length - 10} hata daha.` : ''), success: false };
        }

        const [{ data: classes }, { data: roleData }, { data: courses }] = await Promise.all([
            supabase.from('classes').select('id, name').eq('organization_id', organizationId),
            supabase.from('roles').select('id').eq('name', 'teacher').single(),
            supabase.from('courses').select('id, name, code').eq('organization_id', organizationId),
        ]);

        if (!roleData?.id) return { message: 'Öğretmen rolü sistemde bulunamadı.', success: false };

        const { data: teachers } = await supabase.from('profiles').select('id, email').eq('organization_id', organizationId).eq('role_id', roleData.id);

        const classMap = new Map(classes?.map(c => [c.name.trim().toLowerCase(), c.id]));
        const teacherMap = new Map(teachers?.map(t => [t.email?.trim().toLowerCase(), t.id]));
        const courseMap = new Map(courses?.map(c => [c.name.trim().toLowerCase(), c.id]));

        const coursesToInsert: { organization_id: string; name: string; code: string }[] = [];
        const newCourseNames = new Set<string>();

        for (const { data } of parsedRows) {
            const lowerName = data['Ders Adı'].trim().toLowerCase();
            if (!courseMap.has(lowerName) && !newCourseNames.has(lowerName)) {
                coursesToInsert.push({ organization_id: organizationId, name: data['Ders Adı'].trim(), code: data['Ders Kodu'] || '' });
                newCourseNames.add(lowerName);
            }
        }

        if (coursesToInsert.length > 0) {
            const { data: insertedCourses, error: courseInsertError } = await supabase.from('courses').insert(coursesToInsert).select('id, name');
            if (courseInsertError) return { message: 'Yeni dersler oluşturulurken hata: ' + courseInsertError.message, success: false };
            insertedCourses?.forEach(c => courseMap.set(c.name.trim().toLowerCase(), c.id));
        }

        const rowsToInsert = [];
        for (const { rowIndex, data } of parsedRows) {
            const className = data['Sınıf Adı'].trim();
            const teacherEmail = (data['Öğretmen Email'] || data['Öğretmen Maili'])?.trim();
            const courseName = data['Ders Adı'].trim();
            const dayStr = data['Gün'].trim();

            const classId = classMap.get(className.toLowerCase());
            if (!classId) { errors.push(`Satır ${rowIndex}: Sınıf bulunamadı (${className})`); continue; }
            if (!teacherEmail) { errors.push(`Satır ${rowIndex}: Öğretmen emaili eksik.`); continue; }
            const teacherId = teacherMap.get(teacherEmail.toLowerCase());
            if (!teacherId) { errors.push(`Satır ${rowIndex}: Öğretmen bulunamadı (${teacherEmail})`); continue; }
            const courseId = courseMap.get(courseName.toLowerCase());
            if (!courseId) { errors.push(`Satır ${rowIndex}: Ders ID bulunamadı (${courseName})`); continue; }
            const dayOfWeek = DAYS_MAP[dayStr] || DAYS_MAP[Object.keys(DAYS_MAP).find(k => k.toLowerCase() === dayStr.toLowerCase()) || ''];
            if (!dayOfWeek) { errors.push(`Satır ${rowIndex}: Geçersiz gün (${dayStr})`); continue; }
            const startTime = parseTime(data['Başlangıç Saati']);
            const endTime = parseTime(data['Bitiş Saati']);
            if (!startTime || !endTime) { errors.push(`Satır ${rowIndex}: Saat formatı hatalı.`); continue; }

            rowsToInsert.push({ organization_id: organizationId, class_id: classId, teacher_id: teacherId, course_id: courseId, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime, room_name: data['Oda'] });
        }

        if (errors.length > 0) {
            return { message: errors.slice(0, 10).join('\n') + (errors.length > 10 ? `... ve ${errors.length - 10} hata daha.` : ''), success: false };
        }

        const BATCH_SIZE = 100;
        let successCount = 0;
        const insertErrors: string[] = [];

        for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
            const { error: batchError } = await supabase.from('schedule').insert(rowsToInsert.slice(i, i + BATCH_SIZE));
            if (batchError) {
                insertErrors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1} Hatası: ${batchError.message}`);
            } else {
                successCount += Math.min(BATCH_SIZE, rowsToInsert.length - i);
            }
        }

        if (insertErrors.length > 0) {
            return { message: `${successCount} ders yüklendi, ancak bazı hatalar oluştu:\n${insertErrors.join('\n')}`, success: false };
        }

        revalidateSchedulePaths();
        return { message: `${successCount} ders başarıyla yüklendi.`, success: true };

    } catch (err: unknown) {
        logger.error('Ders programı yükleme hatası', { userId: user.id, organizationId, action: 'uploadSchedule' }, err);
        return { message: 'Beklenmeyen bir hata oluştu.', success: false };
    }
}
