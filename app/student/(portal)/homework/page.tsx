import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, FileText } from 'lucide-react';
import { HomeworkCard } from '@/components/dashboard/student/homework-card';

async function getHomework(userId: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        (process.env.NEXT_PUBLIC_SUPABASE_URL as string), // NOSONAR
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // NOSONAR
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    );

    // Get user's class_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('class_id')
        .eq('id', userId)
        .single();

    if (!profile?.class_id) return [];

    // 1. Fetch ALL homeworks assigned to this student's class
    // We also check for 'assigned_student_ids' logic if used, but for now assuming class-based or individual check
    // The previous logic relied on 'homework_submissions' existence.
    // New logic: 
    // - Get homeworks for class_id
    // - Get submissions for student_id
    // - Merge them

    const { data: homeworks } = await supabase
        .from('homework')
        .select(`
            id,
            description,
            due_date,
            teacher:teacher_id(full_name),
            assigned_student_ids
        `)
        .eq('class_id', profile.class_id!) // NOSONAR
        .order('due_date', { ascending: true }); // Show soonest due first

    if (!homeworks) return [];

    // 2. Fetch submissions for this student
    const { data: submissions } = await supabase
        .from('homework_submissions')
        .select('homework_id, status, submitted_at, teacher_feedback')
        .eq('student_id', userId);

    // Map submission status to homeworks
    const submissionMap = new Map(submissions?.map(s => [s.homework_id, s]) || []);

    const result = homeworks.map(hw => {
        // Filter out if 'assigned_student_ids' exists and student is NOT in it (if that logic is active)
        if (hw.assigned_student_ids && Array.isArray(hw.assigned_student_ids)) {
            // If assigned_student_ids is not null/empty, check if user is in it. 
            // If it IS null, it means "whole class". 
            // (Assuming 'assigned_student_ids' stores IDs as strings)
            // Note: Supabase JSON filtering is tricky in JS, easier to do here if dataset is small.
            if (hw.assigned_student_ids.length > 0 && !hw.assigned_student_ids.includes(userId)) {
                return null;
            }
        }

        const sub = submissionMap.get(hw.id);
        return {
            ...hw,
            submission_status: sub?.status || 'pending', // Default to pending if no record found (legacy/migration case)
            submitted_at: sub?.submitted_at,
            teacher_feedback: sub?.teacher_feedback
        };
    }).filter(Boolean); // Remove nulls

    return result;
}

export default async function StudentHomeworkPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, // NOSONAR
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // NOSONAR
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const allHomework = await getHomework(user.id);

    const pendingHomework = allHomework.filter((hw: any) =>
        hw.submission_status === 'pending' || !hw.submission_status
    );
    const pastHomework = allHomework.filter((hw: any) =>
        hw.submission_status === 'submitted' || hw.submission_status === 'approved' || hw.submission_status === 'rejected'
    );

    // Capture time on server render to pass to client component for consistent hydration
    const serverNow = new Date();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ödevlerim</h2>
                    <p className="text-slate-500 dark:text-slate-400">Bekleyen ve tamamlanan ödevler</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <FileText className="w-5 h-5 text-blue-500" />
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="pending">Yapılacaklar ({pendingHomework.length})</TabsTrigger>
                    <TabsTrigger value="past">Tamamlanan/Geçmiş ({pastHomework.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    {pendingHomework.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingHomework.map((hw: any) => (
                                <HomeworkCard key={hw.id} hw={hw} status="pending" referenceDate={serverNow} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-3">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Harika!</h3>
                            <p className="text-sm text-slate-500">Hiç bekleyen ödevin yok.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pastHomework.map((hw: any) => (
                            <HomeworkCard key={hw.id} hw={hw} status="past" referenceDate={serverNow} />
                        ))}
                        {pastHomework.length === 0 && (
                            <p className="text-slate-500 text-center col-span-3 py-8">Geçmiş ödev bulunamadı.</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}


