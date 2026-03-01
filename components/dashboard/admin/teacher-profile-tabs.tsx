"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface TeacherProfileTabsProps {
    homeworks: any[];
    studySessions: any[];
    weeklySchedule: any;
}

export default function TeacherProfileTabs({ homeworks, studySessions, weeklySchedule }: Readonly<TeacherProfileTabsProps>) {
    const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

    return (
        <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px] mb-4">
                <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                <TabsTrigger value="homework">Ödevler</TabsTrigger>
                <TabsTrigger value="study">Etütler</TabsTrigger>
                <TabsTrigger value="schedule">Ders Programı</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Son Ödevler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {homeworks && homeworks.length > 0 ? (
                                <div className="space-y-4">
                                    {homeworks.slice(0, 5).map((hw: any) => (
                                        <div key={hw.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-medium truncate max-w-[200px]">{hw.description}</div>
                                                <div className="text-xs text-slate-500">{hw.classes?.name}</div>
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {format(new Date(hw.due_date), "d MMM", { locale: tr })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-slate-500 text-sm">Henüz ödev yok.</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Son Etütler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {studySessions && studySessions.length > 0 ? (
                                <div className="space-y-4">
                                    {studySessions.slice(0, 5).map((session: any) => {
                                        const displayTopic = session.topic === "Müsaitlik" ? "Müsait Zaman Dilimi" : session.topic;
                                        const statusMap: Record<string, string> = {
                                            'available': 'Müsait',
                                            'approved': 'Onaylandı',
                                            'completed': 'Tamamlandı',
                                            'cancelled': 'İptal',
                                            'pending': 'Bekliyor',
                                            'no_show': 'Gelmedi'
                                        };
                                        const statusLabel = statusMap[session.status] || session.status;

                                        return (
                                            <div key={session.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                                <div>
                                                    <div className="font-medium">{displayTopic || "Konu belirtilmemiş"}</div>
                                                    <div className="text-xs text-slate-500">{session.profiles?.full_name || 'Öğrenci Yok'}</div>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {statusLabel}
                                                </Badge>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-slate-500 text-sm">Henüz etüt yok.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="homework" className="mt-0">
                <Card>
                    <CardHeader>
                        <CardTitle>Tüm Ödevler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Açıklama</TableHead>
                                    <TableHead>Sınıf</TableHead>
                                    <TableHead>Teslim Tarihi</TableHead>
                                    <TableHead>Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {homeworks && homeworks.length > 0 ? (
                                    homeworks.map((hw: any) => {
                                        const dueDate = hw.due_date ? new Date(hw.due_date) : new Date(0); // If no date, assume past
                                        const isPast = dueDate.getTime() < Date.now();
                                        // NOSONAR

                                        // Calculate completion status
                                        const assignedCount = hw.assigned_student_ids?.length || 0;
                                        const approvedCount = hw.homework_submissions?.filter((s: any) => s.status === 'approved').length || 0;
                                        const isSpecificAssignment = assignedCount > 0;
                                        const isFullyApproved = isSpecificAssignment && approvedCount >= assignedCount;

                                        let statusBadge;
                                        if (isFullyApproved) {
                                            statusBadge = <Badge className="bg-green-600 hover:bg-green-700">Tamamlandı</Badge>;
                                        } else if (isPast) {
                                            statusBadge = <Badge variant="secondary">Geçmiş</Badge>;
                                        } else {
                                            statusBadge = <Badge className="bg-blue-600 hover:bg-blue-700">Aktif</Badge>;
                                        }

                                        return (
                                            <TableRow key={hw.id}>
                                                <TableCell className="font-medium">{hw.description}</TableCell>
                                                <TableCell>{hw.classes?.name}</TableCell>
                                                <TableCell>{format(new Date(hw.due_date), "d MMM yyyy", { locale: tr })}</TableCell>
                                                <TableCell>{statusBadge}</TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6 text-slate-500">Ödev kaydı bulunamadı.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="study" className="mt-0">
                <Card>
                    <CardHeader>
                        <CardTitle>Tüm Etüt Geçmişi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Öğrenci</TableHead>
                                    <TableHead>Konu</TableHead>
                                    <TableHead>Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studySessions && studySessions.length > 0 ? (
                                    studySessions.map((session: any) => {
                                        const displayTopic = session.topic === "Müsaitlik" ? "-" : session.topic;

                                        const statusMap: Record<string, string> = {
                                            'available': 'Müsait',
                                            'approved': 'Onaylandı',
                                            'completed': 'Tamamlandı',
                                            'cancelled': 'İptal',
                                            'pending': 'Bekliyor',
                                            'no_show': 'Gelmedi'
                                        };
                                        const statusLabel = statusMap[session.status] || session.status;

                                        // Optional: Badge colors
                                        let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
                                        if (session.status === 'approved') badgeVariant = "default";
                                        if (session.status === 'available') badgeVariant = "secondary";

                                        return (
                                            <TableRow key={session.id}>
                                                <TableCell>{format(new Date(session.scheduled_at), "d MMM yyyy HH:mm", { locale: tr })}</TableCell>
                                                <TableCell>{session.profiles?.full_name || '-'}</TableCell>
                                                <TableCell>{displayTopic}</TableCell>
                                                <TableCell>
                                                    <Badge variant={badgeVariant}>{statusLabel}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6 text-slate-500">Etüt kaydı bulunamadı.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="schedule" className="mt-0">
                <Card>
                    <CardHeader>
                        <CardTitle>Haftalık Ders Programı</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-w-[800px] overflow-x-auto">
                            {dayNames.map((dayName, index) => {
                                const dayNum = index + 1; // 1=Mon, 7=Sun
                                const daySessions = weeklySchedule[dayNum] || [];

                                return (
                                    <div key={dayNum} className="space-y-3">
                                        <div className="font-semibold text-center py-2 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300">
                                            {dayName}
                                        </div>
                                        <div className="space-y-2">
                                            {daySessions.length > 0 ? (
                                                daySessions.map((s: any) => (
                                                    <div key={s.id} className="p-3 bg-white dark:bg-slate-900 border rounded-md shadow-sm">
                                                        <div className="text-base font-bold text-indigo-600">{s.start_time?.substring(0, 5)} - {s.end_time?.substring(0, 5)}</div>
                                                        <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{s.classes?.name}</div>
                                                        {s.courses?.name && s.courses?.name !== "Müsaitlik" && (
                                                            <div className="text-sm text-slate-500 mt-1">{s.courses?.name}</div>
                                                        )}
                                                        {s.room_name && <div className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Users className="w-3 h-3" /> {s.room_name}</div>}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-24 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-md flex items-center justify-center text-xs text-slate-300">
                                                    Ders Yok
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
