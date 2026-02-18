'use server'

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth-context";
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { getUserRole } from '@/lib/auth-helpers'
import { Profile } from '@/types/database'
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

// Ders programına yeni öğe ekle
export async function addScheduleItem(formData: ScheduleFormData) {
    const { supabase, user, organizationId, error } = await getAuthContext();
    if (error || !user || !organizationId) return { success: false, error: error || "Unauthorized" };

    // Yetki Kontrolü
    const userRole = user.app_metadata?.role || user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return { success: false, error: "Bu işlem için yetkiniz bulunmamaktadır." };
    }

    // Doğrulama
    if (!formData.course_id || !formData.teacher_id || !formData.class_id || !formData.start_time || !formData.end_time) {
        return { success: false, error: "Lütfen tüm zorunlu alanları doldurunuz." };
    }

    // Çakışma kontrolü
    const { data: conflicts, error: conflictError } = await supabase
        .from('schedule')
        .select('id')
        .eq('teacher_id', formData.teacher_id)
        .eq('day_of_week', formData.day_of_week)
        .lt('start_time', formData.end_time)
        .gt('end_time', formData.start_time);

    if (conflictError) return { success: false, error: "Çakışma kontrolü yapılamadı." };

    if (conflicts && conflicts.length > 0) {
        return { success: false, error: "Seçilen öğretmenin bu saat aralığında başka bir dersi var." };
    }

    // Ekle
    const { error: dbError } = await supabase
        .from('schedule')
        .insert({
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            course_id: formData.course_id,
            teacher_id: formData.teacher_id,
            class_id: formData.class_id,
            room_name: formData.room_name,
            organization_id: organizationId
        });

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/schedule');
    revalidatePath('/teacher/schedule');
    revalidatePath('/student/schedule');

    return { success: true };
}

export async function deleteScheduleItem(id: string) {
    const { supabase, user, error } = await getAuthContext();
    if (error || !user) return { success: false, error: error || "Unauthorized" };

    // Yetki Kontrolü
    const userRole = user.app_metadata?.role || user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return { success: false, error: "Bu işlem için yetkiniz bulunmamaktadır." };
    }

    const { error: dbError } = await supabase
        .from('schedule')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/schedule');
    return { success: true };
}

export async function updateScheduleItem(id: string, formData: ScheduleFormData) {
    const { supabase, user, error } = await getAuthContext();
    if (error || !user) return { success: false, error: error || "Unauthorized" };

    // Yetki Kontrolü
    const userRole = user.app_metadata?.role || user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return { success: false, error: "Bu işlem için yetkiniz bulunmamaktadır." };
    }

    const { error: dbError } = await supabase
        .from('schedule')
        .update({
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            course_id: formData.course_id,
            teacher_id: formData.teacher_id,
            class_id: formData.class_id,
            room_name: formData.room_name
        })
        .eq('id', id);

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/schedule');
    revalidatePath('/teacher/schedule');
    revalidatePath('/student/schedule');

    return { success: true };
}

export async function deleteAllSchedule() {
    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !organizationId || !user) return { success: false, error: error || "Unauthorized" };

    // Yetki Kontrolü
    const userRole = user.app_metadata?.role || user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return { success: false, error: "Bu işlem için yetkiniz bulunmamaktadır." };
    }

    const { error: dbError } = await supabase
        .from('schedule')
        .update({ deleted_at: new Date().toISOString() })
        .eq('organization_id', organizationId);

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/schedule');
    revalidatePath('/teacher/schedule');
    revalidatePath('/student/schedule');

    return { success: true };
}

const DAYS_MAP: Record<string, number> = {
    'Pazartesi': 1,
    'Salı': 2,
    'Çarşamba': 3,
    'Perşembe': 4,
    'Cuma': 5,
    'Cumartesi': 6,
    'Pazar': 7,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7
}

function parseTime(timeStr: string | number): string | null {
    if (!timeStr) return null;
    // Excel uses fractional days for time (e.g. 0.5 = 12:00)
    if (typeof timeStr === 'number') {
        const totalSeconds = Math.round(timeStr * 86400);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
    // If string "09:00" or "09.00"
    if (typeof timeStr === 'string') {
        // Replace dot with colon
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
    'Oda': z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : '')
}).refine(data => {
    return data['Öğretmen Email'] || data['Öğretmen Maili'];
}, {
    message: "Öğretmen Email is required",
    path: ['Öğretmen Email']
});

export async function uploadSchedule(prevState: unknown, formData: FormData) {
    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !user || !organizationId) return { message: error || 'Unauthorized', success: false };

    try {
        // Role check
        const userRole = user.app_metadata?.role || user.user_metadata?.role;
        if (userRole !== ROLES.ADMIN && userRole !== ROLES.SUPER_ADMIN) {
            return { message: 'Sadece yöneticiler ders programı yükleyebilir.', success: false }
        }

        // 2. Parse File
        const file = formData.get('file') as File
        if (!file) {
            return { message: 'Dosya seçilmedi.', success: false }
        }

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        if (jsonData.length === 0) {
            return { message: 'Dosya boş.', success: false }
        }

        // 3. Collect Unique Values
        const classNames = new Set<string>();
        const teacherEmails = new Set<string>();
        const courseNames = new Set<string>();

        // Temporary storage for row data to avoid re-parsing
        const parsedRows: any[] = [];
        const errors: string[] = [];

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowIndex = i + 2;
            const result = ScheduleRowSchema.safeParse(row);

            if (!result.success) {
                const errorMsg = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                errors.push(`Satır ${rowIndex}: Geçersiz veri (${errorMsg})`);
                continue;
            }

            const data = result.data;
            const className = data['Sınıf Adı'].trim();
            const teacherEmail = (data['Öğretmen Email'] || data['Öğretmen Maili'])?.trim();
            const courseName = data['Ders Adı'].trim();

            if (className) classNames.add(className.toLowerCase());
            if (teacherEmail) teacherEmails.add(teacherEmail.toLowerCase());
            if (courseName) courseNames.add(courseName.toLowerCase());

            parsedRows.push({ rowIndex, data });
        }

        if (errors.length > 0) {
            return { message: errors.slice(0, 10).join('\n') + (errors.length > 10 ? `... ve ${errors.length - 10} hata daha.` : ''), success: false };
        }

        // 4. Bulk Fetch Existing Data
        const { data: classes } = await supabase
            .from('classes')
            .select('id, name')
            .eq('organization_id', organizationId)
        // .in('name', Array.from(classNames)) // Case sensitivity might be an issue with .in(), better fetch all or handle carefully. 
        // Since we stored lowercased names in Set, but DB might have different casing. 
        // For safety and simplicity in this context, fetching all for the org is safer if the org size is reasonable.
        // Adjusting to fetch all classes for the org to ensure we match case-insensitively via map.

        // Fetch teacher role ID first to avoid "string | undefined" error
        const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'teacher').single();
        const teacherRoleId = roleData?.id;

        if (!teacherRoleId) {
            return { message: 'Öğretmen rolü sistemde bulunamadı.', success: false };
        }

        const { data: teachers } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('organization_id', organizationId)
            .eq('role_id', teacherRoleId)

        const { data: courses } = await supabase
            .from('courses')
            .select('id, name, code')
            .eq('organization_id', organizationId)

        // 5. Create Maps
        const classMap = new Map(classes?.map(c => [c.name.trim().toLowerCase(), c.id]));
        const teacherMap = new Map(teachers?.map(t => [t.email?.trim().toLowerCase(), t.id]));
        const courseMap = new Map(courses?.map(c => [c.name.trim().toLowerCase(), c.id]));

        // 6. Handle Missing Courses (Bulk Insert)
        const coursesToInsert: { organization_id: string, name: string, code: string }[] = [];
        const newCourseNames = new Set<string>();

        parsedRows.forEach(({ data }) => {
            const courseName = data['Ders Adı'].trim();
            const lowerName = courseName.toLowerCase();
            if (!courseMap.has(lowerName) && !newCourseNames.has(lowerName)) {
                coursesToInsert.push({
                    organization_id: organizationId,
                    name: courseName,
                    code: data['Ders Kodu'] || ''
                });
                newCourseNames.add(lowerName);
            }
        });

        if (coursesToInsert.length > 0) {
            const { data: insertedCourses, error: courseInsertError } = await supabase
                .from('courses')
                .insert(coursesToInsert)
                .select('id, name');

            if (courseInsertError) {
                return { message: 'Yeni dersler oluşturulurken hata: ' + courseInsertError.message, success: false };
            }

            insertedCourses?.forEach(c => {
                courseMap.set(c.name.trim().toLowerCase(), c.id);
            });
        }

        // 7. Prepare Schedule Rows
        const rowsToInsert = [];

        for (const { rowIndex, data } of parsedRows) {
            const className = data['Sınıf Adı'].trim();
            const teacherEmail = (data['Öğretmen Email'] || data['Öğretmen Maili'])?.trim();
            const courseName = data['Ders Adı'].trim();
            const dayStr = data['Gün'].trim();

            const classId = classMap.get(className.toLowerCase());
            if (!classId) {
                errors.push(`Satır ${rowIndex}: Sınıf bulunamadı (${className})`);
                continue;
            }

            if (!teacherEmail) {
                errors.push(`Satır ${rowIndex}: Öğretmen emaili eksik.`);
                continue;
            }

            const teacherId = teacherMap.get(teacherEmail.toLowerCase());
            if (!teacherId) {
                errors.push(`Satır ${rowIndex}: Öğretmen bulunamadı (${teacherEmail})`);
                continue;
            }

            const courseId = courseMap.get(courseName.toLowerCase());
            if (!courseId) {
                // Should not happen if bulk insert worked
                errors.push(`Satır ${rowIndex}: Ders ID bulunamadı (${courseName})`);
                continue;
            }

            const dayOfWeek = DAYS_MAP[dayStr] || DAYS_MAP[Object.keys(DAYS_MAP).find(k => k.toLowerCase() === dayStr.toLowerCase()) || ''];
            if (!dayOfWeek) {
                errors.push(`Satır ${rowIndex}: Geçersiz gün (${dayStr})`);
                continue;
            }

            const startTime = parseTime(data['Başlangıç Saati']);
            const endTime = parseTime(data['Bitiş Saati']);

            if (!startTime || !endTime) {
                errors.push(`Satır ${rowIndex}: Saat formatı hatalı.`);
                continue;
            }

            rowsToInsert.push({
                organization_id: organizationId,
                class_id: classId,
                teacher_id: teacherId,
                course_id: courseId,
                day_of_week: dayOfWeek,
                start_time: startTime,
                end_time: endTime,
                room_name: data['Oda']
            });
        }

        if (errors.length > 0) {
            return { message: errors.slice(0, 10).join('\n') + (errors.length > 10 ? `... ve ${errors.length - 10} hata daha.` : ''), success: false };
        }

        // 8. Bulk Insert Schedule
        const BATCH_SIZE = 100;
        let successCount = 0;
        const insertErrors: string[] = [];

        // Optional: Clear existing schedule for these classes/teachers if required? 
        // Typically upload appends or user clears manually. Keeping current behavior (append).

        for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
            const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('schedule').insert(batch);

            if (error) {
                insertErrors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1} Hatası: ${error.message}`);
            } else {
                successCount += batch.length;
            }
        }

        if (insertErrors.length > 0) {
            return {
                message: `${successCount} ders yüklendi, ancak bazı hatalar oluştu:\n${insertErrors.join('\n')}`,
                success: false
            }
        }

        revalidatePath('/admin/schedule');
        revalidatePath('/teacher/schedule');
        revalidatePath('/student/schedule');

        return { message: `${successCount} ders başarıyla yüklendi.`, success: true };

    } catch (error: unknown) {
        return { message: 'Beklenmeyen bir hata oluştu: ' + (error as Error)?.message, success: false }
    }
}
