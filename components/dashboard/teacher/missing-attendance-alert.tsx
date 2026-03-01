'use client';

import { AlertCircle, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MissingAttendanceItem {
    id: string; // schedule id
    courseName: string;
    className: string;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    dayOfWeek: number; // 1-7 ISO
    date: string; // YYYY-MM-DD
}

interface MissingAttendanceAlertProps {
    readonly missingItems: MissingAttendanceItem[];
}

export function MissingAttendanceAlert({ missingItems }: Readonly<MissingAttendanceAlertProps>) {
    // NOSONAR
    if (!missingItems || missingItems.length === 0) return null;

    const days = [
        '', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'
    ];

    return (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-500">
                    <AlertCircle className="h-5 w-5" />
                    <CardTitle className="text-base font-bold">
                        Eksik Yoklama Kayıtları ({missingItems.length})
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                    Aşağıdaki geçmiş derslerin yoklaması henüz sisteme girilmemiş. Lütfen en kısa sürede tamamlayınız.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {missingItems.map((item) => (
                        <div
                            key={`${item.id}-${item.date}`}
                            className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/50 p-3 rounded-md shadow-sm flex flex-col gap-2"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                        {item.courseName}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                                            {item.className}
                                        </Badge>
                                        <span className="text-xs text-slate-500">
                                            {item.startTime}
                                        </span>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]">
                                    {days[item.dayOfWeek]}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </span>
                                <Link href={`/teacher/attendance/${item.id}`}>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2">
                                        Yoklama Al <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
