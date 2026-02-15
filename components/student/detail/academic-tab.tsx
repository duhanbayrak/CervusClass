'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, LineChart, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface StudentAcademicTabProps {
    examResults: any[];
    role: 'admin' | 'teacher';
    studentId: string;
}

export function StudentAcademicTab({ examResults, role, studentId }: StudentAcademicTabProps) {
    return (
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle>Sınav Sonuçları</CardTitle>
                    <CardDescription>Son girilen sınavlar ve puanları</CardDescription>
                </div>
                {role === 'teacher' && (
                    <Link href={`/teacher/students/${studentId}/exams`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <LineChart className="h-4 w-4" />
                            Tüm Sınav Detaylarını Gör
                        </Button>
                    </Link>
                )}
            </CardHeader>
            <CardContent>
                {examResults.length > 0 ? (
                    <div className="space-y-3">
                        {examResults.map((exam) => {
                            const examUrl = role === 'teacher'
                                ? `/teacher/exams/${encodeURIComponent(exam.exam_name)}/students/${studentId}`
                                : `/student/exams/${exam.id}`;

                            return (
                                <Link
                                    key={exam.id}
                                    href={examUrl}
                                    className="block group"
                                >
                                    <div
                                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {exam.exam_name}
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tarih Belirtilmemiş'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                                    {exam.total_net ?? '-'}
                                                </div>
                                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                                                    Net
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <div className="inline-flex p-4 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-4">
                            <TrendingUp className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-sm">Henüz kayıtlı sınav sonucu bulunmuyor.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
