'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface StudentAcademicTabProps {
    examResults: any[];
}

export function StudentAcademicTab({ examResults }: StudentAcademicTabProps) {
    return (
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardHeader>
                <CardTitle>Sınav Sonuçları</CardTitle>
                <CardDescription>Son girilen sınavlar ve puanları</CardDescription>
            </CardHeader>
            <CardContent>
                {examResults.length > 0 ? (
                    <div className="space-y-3">
                        {examResults.map((exam) => (
                            <div
                                key={exam.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors"
                            >
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">
                                        {exam.exam_name}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {new Date(exam.exam_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                        {exam.score}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                                        Puan
                                    </div>
                                </div>
                            </div>
                        ))}
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
