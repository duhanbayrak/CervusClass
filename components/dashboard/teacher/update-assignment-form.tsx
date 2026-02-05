"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClassItem {
    id: string;
    name: string;
}

interface Student {
    id: string;
    full_name: string;
}

interface UpdateAssignmentFormProps {
    assignment: {
        id: string;
        description: string;
        class_id: string;
        due_date: string;
        assigned_student_ids: string[] | null;
    };
    classes: ClassItem[];
    userId: string;
}

export default function UpdateAssignmentForm({ assignment, classes, userId }: UpdateAssignmentFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [description, setDescription] = useState(assignment.description);
    const [classId, setClassId] = useState(assignment.class_id);
    const [date, setDate] = useState<Date | undefined>(new Date(assignment.due_date));

    // Assignment Mode State
    const [assignmentMode, setAssignmentMode] = useState<'entire_class' | 'selected_students'>(
        assignment.assigned_student_ids && assignment.assigned_student_ids.length > 0
            ? 'selected_students'
            : 'entire_class'
    );
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>(
        assignment.assigned_student_ids || []
    );
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Create supabase client once
    const [supabase] = useState(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ));

    // Fetch students when classId changes
    useEffect(() => {
        const fetchStudents = async () => {
            if (!classId) return;

            setLoadingStudents(true);
            try {
                // Get students for this class from profiles
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('class_id', classId)
                    .eq('role_id', '380914a0-783e-4300-8fb7-b55c81f575b7') // Student role
                    .order('full_name');

                if (error) {
                    console.error('Error fetching students:', error);
                    return;
                }

                setStudents(data || []);

                // If class changed and we are not in initial load (simple check), maybe reset selection?
                // But for update form, we want to keep initial selection if class hasn't changed.
                // If class changes, existing selection might be invalid.
                if (classId !== assignment.class_id) {
                    setSelectedStudents([]);
                }

            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoadingStudents(false);
            }
        };

        fetchStudents();
    }, [classId, supabase, assignment.class_id]);

    const handleStudentToggle = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudents(students.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description || !classId || !date) {
            alert("Lütfen tüm alanları doldurunuz.");
            return;
        }

        if (assignmentMode === 'selected_students' && selectedStudents.length === 0) {
            alert("Lütfen en az bir öğrenci seçiniz.");
            return;
        }

        setIsLoading(true);

        try {
            const assignedIds = assignmentMode === 'selected_students' ? selectedStudents : null;

            const { error } = await supabase
                .from('homework')
                .update({
                    description: description,
                    class_id: classId,
                    due_date: date.toISOString(),
                    assigned_student_ids: assignedIds, // This corresponds to jsonb column
                })
                .eq('id', assignment.id)
                .eq('teacher_id', userId);

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/teacher/homework');
                router.refresh();
            }, 1000);

        } catch (error: any) {
            console.error("Error updating assignment:", error);
            alert("Ödev güncellenirken bir hata meydana geldi: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="border-green-100 bg-green-50 dark:bg-green-900/20 dark:border-green-900 h-96 flex flex-col items-center justify-center text-center">
                <div className="bg-green-100 dark:bg-green-800 p-3 rounded-full mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">Başarılı!</h3>
                <p className="text-green-700 dark:text-green-400">Ödev başarıyla güncellendi.</p>
                <p className="text-sm text-green-600 dark:text-green-500 mt-2">Yönlendiriliyorsunuz...</p>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                    <CardTitle>Ödev Düzenle</CardTitle>
                    <CardDescription>Mevcut ödev bilgilerini güncelleyin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="space-y-2">
                        <Label htmlFor="class">Sınıf Seçimi</Label>
                        <Select value={classId} onValueChange={setClassId}>
                            <SelectTrigger id="class" className="w-full">
                                <SelectValue placeholder="Bir sınıf seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Assignment Mode */}
                    <div className="space-y-3">
                        <Label>Atama Kapsamı</Label>
                        <RadioGroup
                            value={assignmentMode}
                            onValueChange={(val: 'entire_class' | 'selected_students') => setAssignmentMode(val)}
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <div className="flex items-center space-x-2 border rounded-md p-3 flex-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => setAssignmentMode('entire_class')}>
                                <RadioGroupItem value="entire_class" id="entire_class" />
                                <Label htmlFor="entire_class" className="cursor-pointer flex-1">Tüm Sınıf</Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-md p-3 flex-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => setAssignmentMode('selected_students')}>
                                <RadioGroupItem value="selected_students" id="selected_students" />
                                <Label htmlFor="selected_students" className="cursor-pointer flex-1">Belirli Öğrenciler</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Student Selection List */}
                    {assignmentMode === 'selected_students' && (
                        <div className="space-y-2 border rounded-md p-4 bg-slate-50 dark:bg-slate-900/50 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <Label>Öğrenci Seçimi ({selectedStudents.length} Seçili)</Label>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="select-all"
                                        checked={students.length > 0 && selectedStudents.length === students.length}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <Label htmlFor="select-all" className="text-sm font-normal cursor-pointer text-muted-foreground">Tümünü Seç</Label>
                                </div>
                            </div>

                            {loadingStudents ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                </div>
                            ) : students.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Bu sınıfta kayıtlı öğrenci bulunamadı.</p>
                            ) : (
                                <ScrollArea className="h-[200px] pr-4">
                                    <div className="space-y-2">
                                        {students.map((student) => (
                                            <div key={student.id} className="flex items-center space-x-2 p-2 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                                <Checkbox
                                                    id={`student-${student.id}`}
                                                    checked={selectedStudents.includes(student.id)}
                                                    onCheckedChange={() => handleStudentToggle(student.id)}
                                                />
                                                <Label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer font-normal">
                                                    {student.full_name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="date">Son Teslim Tarihi</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    locale={tr}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Ödev Açıklaması / Konu</Label>
                        <Textarea
                            id="description"
                            placeholder="Ödev açıklamasını girin..."
                            className="min-h-[120px]"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t bg-slate-50 dark:bg-slate-900/50 p-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        disabled={isLoading}
                    >
                        İptal
                    </Button>
                    <Button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Güncelle
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
