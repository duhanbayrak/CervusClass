import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from '@/lib/env';
import StudentList from '@/components/dashboard/teacher/student-list';

// Next.js 15+ Page props type
interface PageProps {
    searchParams: Promise<{
        query?: string;
        class?: string;
    }>;
}

interface StudentWithClass {
    id: string;
    student_number?: string;
    full_name: string;
    email?: string;
    avatar_url: string | null;
    classes: {
        name: string;
    } | null;
    roles?: {
        name: string;
    } | null;
}

async function getData(query?: string, className?: string) {
    const cookieStore = await cookies();
    const { url, anonKey } = getSupabaseEnv();
    const supabase = createServerClient(
        url,
        anonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    );

    // Determine join type based on filter
    // If filtering by class, use inner join (!inner) to only return students in that class.
    // If showing all, use left join (default) to show students even if they have no class.
    const classSelection = (className && className !== 'all') ? 'classes!inner(name)' : 'classes(name)';

    // Build Query
    let dbQuery = supabase
        .from('profiles')
        .select(`
            id,
            student_number,
            full_name,
            email,
            avatar_url,
            ${classSelection},
            roles!inner(name)
        `)
        .eq('roles.name', 'student')
        .order('full_name');

    // Apply Search Filter
    if (query && query.length >= 3) {
        // Using simple ilike for specific column to avoid complexity causing errors
        dbQuery = dbQuery.ilike('full_name', `%${query}%`);
    }

    // Apply Class Filter
    if (className && className !== 'all') {
        dbQuery = dbQuery.eq('classes.name', className);
    }

    const { data: students, error } = await dbQuery;

    // Get all classes for filter dropdown
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');

    if (error) {

        return { students: [], classes: [], error: error.message || 'Unknown error occurred' };
    }



    return {
        students: (students as unknown as StudentWithClass[]) || [],
        classes: classes || [],
        error: null
    };
}

export default async function TeacherStudentsPage(props: Readonly<PageProps>) {
    const searchParams = await props.searchParams;
    const query = searchParams.query;
    const className = searchParams.class;

    const { students, classes, error } = await getData(query, className);

    if (error) {
        return <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200">Hata: {error}</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Öğrenciler</h2>
                    <p className="text-slate-500 dark:text-slate-400">Tüm öğrenci listesi ve sınıf bilgileri</p>
                </div>
            </div>

            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>}>
                <StudentList students={students} classes={classes || []} />
            </Suspense>
        </div>
    );
}
