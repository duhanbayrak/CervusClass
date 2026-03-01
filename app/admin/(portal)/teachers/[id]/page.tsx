import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, BookOpen, Clock } from 'lucide-react';
import TeacherProfileTabs from '@/components/dashboard/admin/teacher-profile-tabs';
import TeacherProfileEditButton from '@/components/dashboard/admin/teacher-profile-edit-button';

interface TeacherProfilePageProps {
    params: Promise<{
        id: string;
    }>
}

async function getTeacherProfile(id: string) {
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

    // 0. Fetch All Branches (for edit dialog)
    const { data: branchesData } = await supabase
        .from('branches')
        .select('name');

    const branches = branchesData?.map(b => b.name) || [];

    // 1. Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            *,
            branches (name)
        `)
        .eq('id', id)
        .single();

    if (!profile) return null;

    // 2. Fetch Homework Stats & List
    const { data: homeworks } = await supabase
        .from('homework')
        .select(`
            id,
            description,
            due_date,
            classes (name),
            assigned_student_ids,
            homework_submissions (
                status,
                student_id
            )
        `)
        .eq('teacher_id', id)
        .order('due_date', { ascending: false });

    // 3. Fetch Study Sessions
    const { data: studySessions } = await supabase
        .from('study_sessions')
        .select(`
            id,
            topic,
            status,
            scheduled_at,
            profiles:student_id (full_name)
        `)
        .eq('teacher_id', id)
        .order('scheduled_at', { ascending: false });

    // 4. Fetch Schedule
    const { data: schedule } = await supabase
        .from('schedule')
        .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            room_name,
            classes (name),
            courses (name)
        `)
        .eq('teacher_id', id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });


    // Calculations
    const totalHomeworks = homeworks?.length || 0;
    const activeHomeworks = homeworks?.filter(h => new Date(h.due_date) > new Date()).length || 0;

    const totalStudySessions = studySessions?.filter(s => s.status === 'completed').length || 0;
    const studyHours = totalStudySessions; // Assuming 1 hour per session, logic can be refined later for rough calc

    // Group schedule by day
    const weeklySchedule: any = {};
    const days = [1, 2, 3, 4, 5, 6, 7]; // Mon-Sun
    days.forEach(d => weeklySchedule[d] = []);

    schedule?.forEach(s => {
        if (weeklySchedule[s.day_of_week]) {
            weeklySchedule[s.day_of_week].push(s);
        }
    });

    return {
        profile,
        homeworks,
        studySessions,
        weeklySchedule,
        stats: {
            totalHomeworks,
            activeHomeworks,
            totalStudySessions,
            studyHours
        },
        branches // Return branches
    };
}

export default async function TeacherProfilePage({ params }: Readonly<TeacherProfilePageProps>) { // NOSONAR
    const { id } = await params;
    const data = await getTeacherProfile(id);

    if (!data) {
        notFound();
    }

    const { profile, homeworks, studySessions, weeklySchedule, stats, branches } = data;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header / Profile Card */}
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex flex-col md:flex-row justify-between items-end md:items-end -mt-12 mb-6 gap-4">
                        <div className="flex items-end gap-6">
                            <Avatar className="w-24 h-24 border-4 border-white shadow-lg bg-white">
                                <AvatarImage src={profile.avatar_url || ''} />
                                <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-600">
                                    {profile.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="mb-1">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.full_name}</h1>
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <Badge variant="secondary" className="font-normal">
                                        {profile.branches?.name || 'Branş Belirtilmemiş'}
                                    </Badge>
                                    {profile.title && <span>• {profile.title}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-2">
                            <TeacherProfileEditButton teacher={profile} branches={branches} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <div className="p-2 bg-slate-100 rounded-lg dark:bg-slate-800">
                                <Mail className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400">E-posta</span>
                                <span className="text-sm font-medium">{profile.email || '-'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <div className="p-2 bg-slate-100 rounded-lg dark:bg-slate-800">
                                <Phone className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400">Telefon</span>
                                <span className="text-sm font-medium">{profile.phone || '-'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <div className="p-2 bg-slate-100 rounded-lg dark:bg-slate-800">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400">Toplam Ödev</span>
                                <span className="text-sm font-medium">{stats.totalHomeworks} ({stats.activeHomeworks} Aktif)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <div className="p-2 bg-slate-100 rounded-lg dark:bg-slate-800">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400">Toplam Etüt</span>
                                <span className="text-sm font-medium">{stats.totalStudySessions} Oturum</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Client Component Tabs */}
            <TeacherProfileTabs
                homeworks={homeworks ?? []}
                studySessions={studySessions ?? []}
                weeklySchedule={weeklySchedule}
            />
        </div>
    );
}
