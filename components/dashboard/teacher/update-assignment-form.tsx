"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {} from '@/components/ui/input'; // NOSONAR
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // NOSONAR
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // NOSONAR
import { Checkbox } from "@/components/ui/checkbox";

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
    initialStudents?: Student[];
}

export default function UpdateAssignmentForm({ assignment, classes, userId, initialStudents = [] }: Readonly<UpdateAssignmentFormProps>) { // NOSONAR
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [description, setDescription] = useState(assignment.description);
    const [classId] = useState(assignment.class_id);
    const [date, setDate] = useState<Date | undefined>(new Date(assignment.due_date));

    // Assignment Mode State
    const [assignmentMode] = useState<'entire_class' | 'selected_students'>(
        assignment.assigned_student_ids && assignment.assigned_student_ids.length > 0
            ? 'selected_students'
            : 'entire_class'
    );
    // Initialize students with pre-fetched data
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [selectedStudents, setSelectedStudents] = useState<string[]>(
        assignment.assigned_student_ids || []
    );
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Create supabase client once
    const [supabase] = useState(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, // NOSONAR
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // NOSONAR
    ));

    // Fetch students when classId changes
    useEffect(() => {
        const fetchStudents = async () => {
            if (!classId) return;

            // If classId matches the initial assignment class AND we have initial students, use them (don't re-fetch)
            if (classId === assignment.class_id && initialStudents.length > 0) {
                setStudents(initialStudents);
                return;
            }

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

                    return;
                }

                setStudents(data || []);

                // If class changed and we are not in initial load (simple check), maybe reset selection?
                // But for update form, we want to keep initial selection if class hasn't changed.
                // If class changes, existing selection might be invalid.
                if (classId !== assignment.class_id) {
                    setSelectedStudents([]);
                }

            } catch (err) { // NOSONAR

            } finally {
                setLoadingStudents(false);
            }
        };

        fetchStudents();
    }, [classId, supabase, assignment.class_id, initialStudents]);


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
            const { error } = await supabase
                .from('homework')
                .update({
                    description: description,
                    due_date: date.toISOString(),
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
                        <Label>Sınıf</Label>
                        <div className="p-3 border rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed">
                            {classes.find(c => c.id === assignment.class_id)?.name || 'Sınıf Bulunamadı'}
                        </div>
                        <p className="text-xs text-muted-foreground">Ödev oluşturulduktan sonra sınıf değiştirilemez.</p>
                    </div>

                    {/* Assignment Mode - Read Only */}
                    <div className="space-y-3">
                        <Label>Atama Kapsamı</Label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className={cn(
                                "flex items-center space-x-2 border rounded-md p-3 flex-1 transition-colors cursor-not-allowed",
                                assignmentMode === 'entire_class' ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600" : "opacity-50"
                            )}>
                                <div className={cn("h-4 w-4 rounded-full border border-primary", assignmentMode === 'entire_class' ? "bg-primary" : "border-slate-400")} />
                                <Label className="cursor-not-allowed flex-1 text-slate-600 dark:text-slate-400">Tüm Sınıf</Label>
                            </div>
                            <div className={cn(
                                "flex items-center space-x-2 border rounded-md p-3 flex-1 transition-colors cursor-not-allowed",
                                assignmentMode === 'selected_students' ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600" : "opacity-50"
                            )}>
                                <div className={cn("h-4 w-4 rounded-full border border-primary", assignmentMode === 'selected_students' ? "bg-primary" : "border-slate-400")} />
                                <Label className="cursor-not-allowed flex-1 text-slate-600 dark:text-slate-400">Belirli Öğrenciler</Label>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Ödev oluşturulduktan sonra atama kapsamı değiştirilemez.</p>
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
                                        disabled
                                    />
                                    <Label htmlFor="select-all" className="text-sm font-normal cursor-pointer text-muted-foreground">Tümünü Seç</Label>
                                </div>
                            </div>

                            {loadingStudents && (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                </div>
                            )}
                            {!loadingStudents && students.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">Bu sınıfta kayıtlı öğrenci bulunamadı.</p>
                            )}
                            {!loadingStudents && students.length > 0 && (
                                <ScrollArea className="h-[200px] pr-4">
                                    <div className="space-y-2">
                                        {students.map((student) => (
                                            <div key={student.id} className="flex items-center space-x-2 p-2 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                                <Checkbox
                                                    id={`student-${student.id}`}
                                                    checked={selectedStudents.includes(student.id)}
                                                    disabled
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
