'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, LineChart, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { DynamicStudentExamChart } from '@/components/student/exams/student-charts-wrapper';

interface StudentAcademicTabProps {
    examResults: any[];
    role: 'admin' | 'teacher' | 'parent';
    studentId: string;
}

export function StudentAcademicTab({ examResults, role, studentId }: Readonly<StudentAcademicTabProps>) { // NOSONAR
    const [activeTab, setActiveTab] = useState<'TYT' | 'AYT'>('TYT');

    // Chart için veriyi hazırla (exam_type dahil)
    const chartData = examResults
        .filter(exam => exam.total_net !== null && exam.exam_date)
        .map(exam => ({
            date: exam.exam_date,
            net: Number(exam.total_net),
            name: exam.exam_name,
            exam_type: exam.exam_type || 'TYT'
        }));

    // Aktif sekmeye göre filtrele
    const filteredChartData = chartData.filter(d => d.exam_type === activeTab);

    return (
        <div className="space-y-6">
            {/* TYT/AYT Sekme Butonları + Grafik */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('TYT')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'TYT'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        TYT
                    </button>
                    <button
                        onClick={() => setActiveTab('AYT')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'AYT'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        AYT
                    </button>
                </div>

                {filteredChartData.length >= 2 ? (
                    <DynamicStudentExamChart data={filteredChartData} />
                ) : (
                    <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm mb-6">
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center justify-center text-center text-slate-400">
                                <Info className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">{activeTab} türünde yeterli sınav verisi bulunmuyor.</p>
                                <p className="text-xs mt-1">Grafik için en az 2 sınav gereklidir.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Liste */}
            <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                    <div className="space-y-1">
                        <CardTitle>Sınav Sonuçları</CardTitle>
                        <CardDescription>Son girilen sınavlar ve puanları</CardDescription>
                    </div>
                    <Link href={role === 'admin' ? `/admin/students/${studentId}/exams` : `/teacher/students/${studentId}/exams`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <LineChart className="h-4 w-4" />
                            Tüm Sınav Detaylarını Gör
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {examResults.length > 0 ? (
                        <div className="space-y-3">
                            {examResults.map((exam) => {
                                const examUrl = role === 'teacher'
                                    ? `/teacher/exams/${encodeURIComponent(exam.exam_name)}/students/${studentId}`
                                    : `/admin/exams/${encodeURIComponent(exam.exam_name)}/students/${studentId}`;

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
        </div>
    );
}
