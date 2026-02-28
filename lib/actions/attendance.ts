'use server';

import { z } from 'zod';
import { revalidatePath } from "next/cache";
import { withAction } from "@/lib/actions/utils/with-action";
import { createBulkNotifications } from "@/lib/actions/notifications";

export type AttendanceItem = {
    student_id: string;
    schedule_id: string;
    date: string;
    status: string;
    late_minutes: number;
    id?: string;
};

const attendanceItemSchema = z.object({
    student_id: z.string().uuid(),
    schedule_id: z.string().uuid(),
    date: z.string(),
    status: z.string(),
    late_minutes: z.number(),
    id: z.string().uuid().optional(),
});

const saveAttendanceSchema = z.array(attendanceItemSchema).min(1, 'En az bir yoklama kaydı gereklidir.');

// Yoklama kaydet (upsert)
export const saveAttendance = withAction(saveAttendanceSchema, async (items, ctx) => {
    const upsertData = items.map(item => ({
        ...item,
        organization_id: ctx.organizationId,
    }));

    const { error: upsertError } = await ctx.supabase
        .from('attendance')
        .upsert(upsertData, { onConflict: 'student_id, schedule_id, date' });

    if (upsertError) {
        return { success: false, error: 'Veritabanı hatası: ' + upsertError.message };
    }

    // Bildirim gönder: devamsız veya geç kalan öğrencilere
    const notifyItems = items.filter(i => i.status === 'absent' || i.status === 'late');
    if (notifyItems.length > 0) {
        const notifications = notifyItems.map(item => ({
            userId: item.student_id,
            title: item.status === 'absent' ? 'Devamsızlık Kaydı' : 'Geç Kalma Kaydı',
            message: item.status === 'absent'
                ? `${item.date} tarihinde devamsızlık kaydınız işlendi.`
                : `${item.date} tarihinde ${item.late_minutes} dakika geç kalma kaydınız işlendi.`,
            type: 'warning' as const,
        }));
        await createBulkNotifications(notifications);
    }

    revalidatePath('/teacher/attendance');
    return { success: true };
});
