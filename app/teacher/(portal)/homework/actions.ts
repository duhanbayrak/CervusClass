'use server'

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

        const { error } = await supabase
            .from('homework')
            .insert({
                description,
                class_id,
                teacher_id,
                organization_id,
                due_date,
                completion_status: {}, // Initial empty status
                assigned_student_ids: studentIdsArray // null for entire class, array for specific students
            });

        if (error) {
            console.error('Database Error:', error);
            return {
                message: 'Veritabanı hatası: Ödev oluşturulamadı.',
            };
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
