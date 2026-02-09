'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type AttendanceItem = {
    student_id: string;
    schedule_id: string;
    date: string;
    status: string;
    late_minutes: number;
    id?: string;
};

export async function saveAttendance(items: AttendanceItem[]) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Oturum açmanız gerekiyor.' };
        }

        // 2. Get Organization ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { success: false, error: 'Kurum bilgisi bulunamadı.' };
        }

        // 3. Prepare Data
        const upsertData = items.map(item => ({
            ...item,
            organization_id: profile.organization_id,
        }));

        // 4. Upsert
        const { error: upsertError } = await supabase
            .from('attendance')
            .upsert(upsertData, { onConflict: 'student_id, schedule_id, date' });

        if (upsertError) {

            return { success: false, error: 'Veritabanı hatası: ' + upsertError.message };
        }

        revalidatePath('/teacher/attendance');
        return { success: true };

    } catch (error: any) {

        return { success: false, error: 'Beklenmedik bir hata oluştu.' };
    }
}
