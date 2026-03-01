'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Clock, Calendar } from 'lucide-react';
import { StatMiniCard } from './info-cards';

interface StudentAttendanceTabProps {
    stats: {
        attendance: {
            class: {
                total: number;
                present: number;
                absent: number;
                late: number;
                excused: number;
                rate: number;
            };
            study: {
                total: number;
                attended: number;
                missed: number;
                rate: number;
            };
        };
    };
}

export function StudentAttendanceTab({ stats }: Readonly<StudentAttendanceTabProps>) { // NOSONAR
    return (
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardHeader>
                <CardTitle>Devamsızlık Bilgisi</CardTitle>
                <CardDescription>Ders ve etüt devamsızlık kayıtları</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Ders Devamsızlık İstatistikleri */}
                {stats.attendance.class.total > 0 ? (
                    <div className="space-y-6">
                        {/* İlerleme Çubuğu */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Ders Katılım Oranı
                                </span>
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                    %{stats.attendance.class.rate}
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                                    style={{ width: `${stats.attendance.class.rate}%` }}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatMiniCard icon={Check} label="Katıldı" value={stats.attendance.class.present} color="green" />
                            <StatMiniCard icon={Clock} label="Geç Kaldı" value={stats.attendance.class.late} color="orange" />
                            <StatMiniCard icon={X} label="Gelmedi" value={stats.attendance.class.absent} color="red" />
                            <StatMiniCard icon={Calendar} label="İzinli" value={stats.attendance.class.excused} color="blue" />
                        </div>

                        {/* Etüt İstatistikleri */}
                        {stats.attendance.study.total > 0 && (
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Etüt Katılım Oranı
                                    </span>
                                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                        %{stats.attendance.study.rate}
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                                        style={{ width: `${stats.attendance.study.rate}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <StatMiniCard icon={Check} label="Katıldı" value={stats.attendance.study.attended} color="green" />
                                    <StatMiniCard icon={X} label="Gelmedi" value={stats.attendance.study.missed} color="red" />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <div className="inline-flex p-4 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-4">
                            <Calendar className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-sm">Henüz devamsızlık kaydı bulunmuyor.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
