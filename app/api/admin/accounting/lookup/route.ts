import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

const getCachedLookupData = unstable_cache(
    async (organizationId: string) => {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Öğrenci rolünü bul
        const { data: studentRole } = await supabaseAdmin
            .from('roles')
            .select('id')
            .eq('name', 'student')
            .single();

        // Öğrenci ve sınıfları paralel çek (sadece o kuruma ait)
        const [studentsResult, classesResult, accountsResult, categoriesResult, servicesResult] = await Promise.all([
            supabaseAdmin
                .from('profiles')
                .select('id, full_name, class_id, classes:classes!class_id(name)')
                .eq('organization_id', organizationId)
                .eq('role_id', studentRole?.id || '')
                .is('deleted_at', null)
                .order('full_name'),
            supabaseAdmin
                .from('classes')
                .select('id, name')
                .eq('organization_id', organizationId)
                .is('deleted_at', null)
                .order('name'),
            supabaseAdmin
                .from('finance_accounts')
                .select('id, name')
                .eq('organization_id', organizationId)
                .eq('is_active', true)
                .order('name'),
            supabaseAdmin
                .from('finance_categories')
                .select('id, name, type')
                .eq('organization_id', organizationId)
                .order('name'),
            supabaseAdmin
                .from('finance_services')
                .select('id, name, type, unit_price, vat_rate, category_id')
                .eq('organization_id', organizationId)
                .eq('is_active', true)
                .order('name'),
        ]);

        // Öğrencileri formatla
        const students = (studentsResult.data || []).map((s: Record<string, unknown>) => ({
            id: s.id as string,
            full_name: s.full_name as string | null,
            class_id: (s.class_id as string) || null,
            class_name: (s.classes as { name: string } | null)?.name || null,
        }));

        return {
            students,
            classes: classesResult.data || [],
            accounts: accountsResult.data || [],
            categories: categoriesResult.data || [],
            services: servicesResult.data || [],
        };
    },
    ['accounting-lookup-data'],
    {
        tags: ['accounting', 'classes', 'profiles'],
        revalidate: 3600 // 1 saat cache
    }
);

/**
 * Muhasebe modülü için öğrenci ve sınıf listesini döndürür.
 * FeeAssignmentDialog bileşeni tarafından kullanılır.
 */
export async function GET() {
    const { organizationId, error } = await getAuthContext();
    if (error || !organizationId) {
        return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await getCachedLookupData(organizationId);
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
