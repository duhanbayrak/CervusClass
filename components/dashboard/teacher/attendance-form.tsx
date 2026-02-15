'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase"; // Removed client usage
import { saveAttendance } from '@/lib/actions/attendance';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Student {
    id: string;
    full_name: string;
    avatar_url: string | null;
}

interface AttendanceRecord {
    status: string;
    late_minutes: number;
    id?: string;
}

interface AttendanceFormProps {
    scheduleId: string;
    classId: string;
    students: Student[];
    attendanceMap: Record<string, AttendanceRecord>;
    date: string;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

export default function AttendanceForm({
    scheduleId,
    classId,
    students,
    attendanceMap,
    date
}: AttendanceFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Initialize state from existing attendance or default to 'present'
    const [attendance, setAttendance] = useState<Record<string, { status: AttendanceStatus; late_minutes: number }>>(() => {
        const initial: Record<string, { status: AttendanceStatus; late_minutes: number }> = {};
        students.forEach(student => {
            const existing = attendanceMap[student.id];
            initial[student.id] = {
                status: (existing?.status as AttendanceStatus) || 'present',
                late_minutes: existing?.late_minutes || 0
            };
        });
        return initial;
    });

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                status,
                late_minutes: status === 'late' ? prev[studentId]?.late_minutes || 5 : 0
            }
        }));
    };

    const handleLateMinutesChange = (studentId: string, minutes: number) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                late_minutes: minutes
            }
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            // Prepare data
            const items = students.map(student => {
                const existingId = attendanceMap[student.id]?.id;
                return {
                    ...(existingId ? { id: existingId } : {}),
                    student_id: student.id,
                    schedule_id: scheduleId,
                    date: date,
                    status: attendance[student.id].status,
                    late_minutes: attendance[student.id].late_minutes
                };
            });

            const supabase = createClient();
            const result = await saveAttendance(items);

            if (!result.success) {
                throw new Error(result.error);
            }

            toast({
                title: "Başarılı",
                description: "Yoklama kaydedildi.",
                className: "bg-green-50 border-green-200"
            });

            router.refresh();
            router.push('/teacher/attendance');

        } catch (error: any) {

            toast({
                variant: "destructive",
                title: "Hata",
                description: error.message || "Yoklama kaydedilemedi."
            });
        } finally {
            setLoading(false);
        }
    };

    // Mark all as present
    const markAllPresent = () => {
        const newState: Record<string, { status: AttendanceStatus; late_minutes: number }> = {};
        students.forEach(s => {
            newState[s.id] = { status: 'present', late_minutes: 0 };
        });
        setAttendance(newState);
    };

    return (
        <div className="space-y-6">
            {/* Quick Actions */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Hepsini Var İşaretle
                </Button>
            </div>

            {/* Student List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => (
                    <div key={student.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Student Info */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={student.avatar_url || undefined} alt={student.full_name} />
                                <AvatarFallback>{student.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-slate-900 dark:text-white">
                                {student.full_name}
                            </span>
                        </div>

                        {/* Status Selection */}
                        <RadioGroup
                            value={attendance[student.id]?.status || 'present'}
                            onValueChange={(val) => handleStatusChange(student.id, val as AttendanceStatus)}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="present" id={`${student.id}-present`} />
                                <Label htmlFor={`${student.id}-present`} className="flex items-center gap-1 cursor-pointer text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Var
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                                <Label htmlFor={`${student.id}-absent`} className="flex items-center gap-1 cursor-pointer text-red-600">
                                    <XCircle className="w-4 h-4" />
                                    Yok
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="late" id={`${student.id}-late`} />
                                <Label htmlFor={`${student.id}-late`} className="flex items-center gap-1 cursor-pointer text-amber-600">
                                    <Clock className="w-4 h-4" />
                                    Geç
                                </Label>
                            </div>
                        </RadioGroup>

                        {/* Late Minutes (Conditional) */}
                        {attendance[student.id]?.status === 'late' && (
                            <div className="flex items-center gap-2 ml-auto">
                                <Label htmlFor={`${student.id}-minutes`} className="text-xs text-slate-500 whitespace-nowrap">
                                    Geç kalma (dk):
                                </Label>
                                <Input
                                    id={`${student.id}-minutes`}
                                    type="number"
                                    min={1}
                                    max={60}
                                    value={attendance[student.id]?.late_minutes || 5}
                                    onChange={(e) => handleLateMinutesChange(student.id, parseInt(e.target.value) || 0)}
                                    className="w-20 h-8"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button onClick={handleSubmit} disabled={loading} className="bg-[#135bec] hover:bg-blue-700">
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Kaydediliyor...
                        </>
                    ) : (
                        'Yoklamayı Kaydet'
                    )}
                </Button>
            </div>
        </div>
    );
}
