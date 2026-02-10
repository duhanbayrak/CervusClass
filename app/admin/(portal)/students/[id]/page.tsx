import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { StudentDetailView } from '@/components/student/student-detail-view';
import { getStudentProfileData } from '@/lib/data/student-profile';

export default async function StudentDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
        <div className="p-8">
            <StudentDetailView
                profile={data.profile}
                examResults={data.examResults}
                stats={data.stats}
                role="admin"
            />
        </div>
    );
}
