import { notFound } from 'next/navigation';
import { getClassById } from '@/lib/actions/class';
import { ClassStudentsView } from '@/components/class/class-students-view';
import { GraduationCap, Users, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function ClassDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    const res = await getClassById(id);

    if (!res.success || !res.data) {
        notFound();
    }

    const cls = res.data;
    const studentCount = cls.profiles?.[0]?.count ?? 0;

    return (
        <div className="flex flex-col gap-6 p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Geri butonu + Sınıf bilgisi */}
                <div className="flex items-center gap-4 flex-1">
                    <Link
                        href="/admin/classes"
                        className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                            <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {cls.name}
                            </h2>
                            <div className="flex items-center gap-3 mt-0.5">
                                <Badge
                                    variant="secondary"
                                    className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-0 font-medium text-xs"
                                >
                                    {cls.grade_level}. Sınıf
                                </Badge>
                                <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                                    <Users className="h-3.5 w-3.5" />
                                    {studentCount} öğrenci
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Öğrenci Listesi */}
            <ClassStudentsView classId={id} className={cls.name} />
        </div>
    );
}
