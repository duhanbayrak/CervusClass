import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';

/**
 * Muhasebe modülü için öğrenci ve sınıf listesini döndürür.
 * FeeAssignmentDialog bileşeni tarafından kullanılır.
 */
export async function GET() {
    const { supabase, error } = await getAuthContext();
    if (error) {
        return NextResponse.json({ error }, { status: 401 });
    }

    // Öğrenci rolünü bul
    const { data: studentRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'student')
        .single();

    // Öğrenci ve sınıfları paralel çek
    const [studentsResult, classesResult] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, full_name, classes:classes!class_id(name)')
            .eq('role_id', studentRole?.id || '')
            .is('deleted_at', null)
            .order('full_name'),
        supabase
            .from('classes')
            .select('id, name')
            .is('deleted_at', null)
            .order('name'),
    ]);

    // Öğrencileri formatla
    const students = (studentsResult.data || []).map(s => ({
        id: s.id,
        full_name: s.full_name,
        class_name: (s.classes as { name: string } | null)?.name || null,
    }));

    return NextResponse.json({
        students,
        classes: classesResult.data || [],
    });
}
