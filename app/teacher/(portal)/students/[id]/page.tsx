import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { StudentDetailView } from '@/components/student/student-detail-view';
import { getStudentProfileData } from '@/lib/data/student-profile';

export default async function StudentDetailPage({ params }: Readonly<{ params: any }>) {
    // NOSONAR
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // NOSONAR
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        // NOSONAR
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    );

    const data = await getStudentProfileData(supabase, id);

    if (!data) {
        notFound();
    }

    return (
        <StudentDetailView
            profile={data.profile}
            examResults={data.examResults}
            stats={data.stats}
            notes={data.notes}
            role="teacher"
        />
    );
}
