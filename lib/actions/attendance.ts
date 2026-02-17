'use server';

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth-context";
import { handleError } from "@/lib/utils/error";

export type AttendanceItem = {
    student_id: string;
    schedule_id: string;
    date: string;
    status: string;
    late_minutes: number;
    id?: string;
};

// Yoklama kaydet (upsert)
export async function saveAttendance(items: AttendanceItem[]) {
    try {
        const { supabase, organizationId, error } = await getAuthContext();
        if (error || !organizationId) return { success: false, error: error || 'Oturum açmanız gerekiyor.' };

        // Veriyi hazırla — organization_id ekle
        const upsertData = items.map(item => ({
            ...item,
            organization_id: organizationId,
        }));

        // Upsert
        const { error: upsertError } = await supabase
            .from('attendance')
            .upsert(upsertData, { onConflict: 'student_id, schedule_id, date' });

        if (upsertError) {
            return { success: false, error: 'Veritabanı hatası: ' + upsertError.message };
        }

        revalidatePath('/teacher/attendance');
        return { success: true };

    } catch (e: unknown) {
        return { success: false, error: `Beklenmedik bir hata oluştu: ${handleError(e)}` };
    }
}

// Hata yönetimi helper kaldırıldı -> lib/utils/error.ts kullanılıyor
