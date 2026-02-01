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
    target_students: z.array(z.string().uuid()).optional().nullable()
});

export type CreateHomeworkState = {
    errors?: {
        description?: string[];
        class_id?: string[];
        due_date?: string[];
        target_students?: string[];
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

    // Parse target_students from JSON string
    const rawTargetStudents = formData.get('target_students');
    let parsedTargetStudents: string[] | null = null;
    if (rawTargetStudents && typeof rawTargetStudents === 'string') {
        try {
            parsedTargetStudents = JSON.parse(rawTargetStudents);
        } catch (e) {
            console.error("Failed to parse target_students", e);
        }
    }

    // Validate fields
    const validatedFields = CreateHomeworkSchema.safeParse({
        description: formData.get('description'),
        class_id: formData.get('class_id'),
        due_date: formData.get('due_date'),
        teacher_id: formData.get('teacher_id'),
        organization_id: formData.get('organization_id'),
        target_students: parsedTargetStudents
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Lütfen form alanlarını kontrol ediniz.',
        };
    }

    const { description, class_id, due_date, teacher_id, organization_id, target_students } = validatedFields.data;

    // Verify auth again for extra security
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== teacher_id) {
        return {
            message: 'Yetkisiz işlem girişimi.',
        }
    }

    try {
        const { error } = await supabase
            .from('homework')
            .insert({
                description,
                class_id,
                teacher_id,
                organization_id,
                due_date,
                completion_status: {}, // Initial empty status
                target_students: target_students || null // Store as jsonb or null
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
    return { message: 'Ödev başarıyla oluşturuldu' };
}
