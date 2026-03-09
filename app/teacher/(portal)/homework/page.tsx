import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import HomeworkListTable from '@/components/dashboard/teacher/homework-list-table';
import { getAuthContext } from '@/lib/auth-context';
import { checkExpiredHomework } from './actions';

const STUDENT_ROLE_ID = '380914a0-783e-4300-8fb7-b55c81f575b7';

export default async function TeacherHomeworkPage() {
    // Merkezi auth context — tek supabase client
    const { supabase, user } = await getAuthContext();

    // Süresi dolmuş ödevler için bildirim kontrolü
    await checkExpiredHomework();

    // Ödevleri çek
    let assignments: any[] = [];
    if (user) {
        const { data: homework } = await supabase
            .from('homework')
            .select(`
                *,
                classes(name)
            `)
            .eq('teacher_id', user.id)
            .order('due_date', { ascending: false });
        assignments = homework || [];
    }

    if (!user || assignments.length === 0) {
        // Boş durum
        const activeAssignments: any[] = [];
        const pastAssignments: any[] = [];

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ödev Yönetimi</h2>
                        <p className="text-slate-500 dark:text-slate-400">Verilen ödevler ve durumları</p>
                    </div>
                    <Link href="/teacher/homework/new">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Yeni Ödev Ekle
                        </Button>
                    </Link>
                </div>

                <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                        <CardTitle>Ödev Listesi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <HomeworkListTable
                            activeAssignments={activeAssignments}
                            pastAssignments={pastAssignments}
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Teslimleri çek
    const homeworkIds = assignments.map(a => a.id);
    const { data: submissions } = await supabase
        .from('homework_submissions')
        .select('homework_id, student_id, status')
        .in('homework_id', homeworkIds);

    // İlgili sınıflardaki öğrencileri çek
    const classIdsToCheck = assignments
        .filter(a => !a.assigned_student_ids || (Array.isArray(a.assigned_student_ids) && a.assigned_student_ids.length === 0))
        .map(a => a.class_id);

    const uniqueClassIds = Array.from(new Set(classIdsToCheck));

    const classStudentsMap: Record<string, number> = {};

    if (uniqueClassIds.length > 0) {
        const { data: students } = await supabase
            .from('profiles')
            .select('id, class_id')
            .eq('role_id', STUDENT_ROLE_ID)
            .in('class_id', uniqueClassIds);

        if (students) {
            students.forEach(s => {
                if (s.class_id) {
                    classStudentsMap[s.class_id] = (classStudentsMap[s.class_id] || 0) + 1;
                }
            });
        }
    }

    // Kategorize et
    const activeAssignments: any[] = [];
    const pastAssignments: any[] = [];
    const now = new Date();

    assignments.forEach(hw => {
        const isPastDue = new Date(hw.due_date) < now;

        // Toplam atanmış öğrenci sayısı
        let totalAssigned = 0;
        if (hw.assigned_student_ids && Array.isArray(hw.assigned_student_ids) && hw.assigned_student_ids.length > 0) {
            totalAssigned = hw.assigned_student_ids.length;
        } else {
            totalAssigned = classStudentsMap[hw.class_id] || 0;
        }

        // Teslim edilen sayısı (status != pending)
        const relevantSubmissions = submissions?.filter(s => s.homework_id === hw.id && s.status !== 'pending') || [];
        const submissionCount = relevantSubmissions.length;

        const allSubmitted = totalAssigned > 0 && submissionCount >= totalAssigned;

        // Durum belirle
        let derivedStatus: 'active' | 'completed' | 'expired' = 'active';

        if (allSubmitted) {
            derivedStatus = 'completed';
        } else if (isPastDue) {
            derivedStatus = 'expired';
        }

        const enrichedAssignment = {
            ...hw,
            totalAssigned,
            submissionCount,
            derivedStatus
        };

        if (derivedStatus === 'active') {
            activeAssignments.push(enrichedAssignment);
        } else {
            pastAssignments.push(enrichedAssignment);
        }
    });


    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ödev Yönetimi</h2>
                    <p className="text-slate-500 dark:text-slate-400">Verilen ödevler ve durumları</p>
                </div>
                <Link href="/teacher/homework/new">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Ödev Ekle
                    </Button>
                </Link>
            </div>

            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                    <CardTitle>Ödev Listesi</CardTitle>
                </CardHeader>
                <CardContent>
                    <HomeworkListTable
                        activeAssignments={activeAssignments}
                        pastAssignments={pastAssignments}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
