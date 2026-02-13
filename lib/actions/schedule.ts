'use server'

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth-context";

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

// Ders programından öğe sil
export async function deleteScheduleItem(id: string) {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    const { error: dbError } = await supabase.from('schedule').delete().eq('id', id);

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/schedule');
    return { success: true };
}

// Ders programı öğesini güncelle
export async function updateScheduleItem(id: string, formData: ScheduleFormData) {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

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

// Tüm ders programını sil
export async function deleteAllSchedule() {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || "Unauthorized" };

    const { error: dbError } = await supabase
        .from('schedule')
        .delete()
        .eq('organization_id', organizationId);

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath('/admin/schedule');
    revalidatePath('/teacher/schedule');
    revalidatePath('/student/schedule');

    return { success: true };
}
