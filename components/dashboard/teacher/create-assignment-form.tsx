"use client"

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, CheckCircle2, Users, UserCheck, ChevronDown } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Removed to fix error
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { createHomework } from '@/app/teacher/(portal)/homework/actions';
import { supabase } from '@/lib/supabase';

interface ClassItem {
    id: string;
    name: string;
}

interface StudentItem {
    id: string;
    full_name: string;
    avatar_url?: string | null;
}

interface CreateAssignmentFormProps {
    classes: ClassItem[];
    userId: string;
    organizationId: string;
}

const formSchema = z.object({
    description: z.string().min(3, { message: "Ödev açıklaması en az 3 karakter olmalıdır." }),
    class_id: z.string().min(1, { message: "Lütfen bir sınıf seçiniz." }),
    due_date: z.date({
        message: "Lütfen geçerli bir tarih seçiniz."
    }),
    assignment_mode: z.enum(['entire_class', 'selected_students']),
});

export default function CreateAssignmentForm({ classes, userId, organizationId }: CreateAssignmentFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const { control, handleSubmit, setError, watch, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: "",
            class_id: "",
            assignment_mode: "entire_class",
        },
    });

    const selectedClassId = watch('class_id');
    const assignmentMode = watch('assignment_mode');

    // Fetch students when class is selected
    useEffect(() => {
        if (selectedClassId) {
            setLoadingStudents(true);
            supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('class_id', selectedClassId)
                .order('full_name', { ascending: true })
                .then(({ data, error }) => {
                    if (error) {
                        console.error('Error fetching students:', error);
                        toast({
                            variant: "destructive",
                            title: "Hata",
                            description: "Öğrenciler yüklenirken bir hata oluştu."
                        });
                    } else {
                        setStudents(data as StudentItem[] || []);
                    }
                    setLoadingStudents(false);
                });
        } else {
            setStudents([]);
            setSelectedStudents([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClassId]);

    // Reset selected students when mode changes
    useEffect(() => {
        if (assignmentMode === 'entire_class') {
            setSelectedStudents([]);
        }
    }, [assignmentMode]);

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const selectAllStudents = () => {
        setSelectedStudents(students.map(s => s.id));
    };

    const deselectAllStudents = () => {
        setSelectedStudents([]);
    };

    function onSubmit(values: z.infer<typeof formSchema>) {
        // Validate student selection if mode is selected_students
        if (values.assignment_mode === 'selected_students' && selectedStudents.length === 0) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Lütfen en az bir öğrenci seçiniz."
            });
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.append('description', values.description);
            formData.append('class_id', values.class_id);
            formData.append('due_date', values.due_date.toISOString());
            formData.append('teacher_id', userId);
            formData.append('organization_id', organizationId);
            formData.append('assignment_mode', values.assignment_mode);

            if (values.assignment_mode === 'selected_students') {
                formData.append('assigned_student_ids', JSON.stringify(selectedStudents));
            }

            const result = await createHomework(undefined, formData);

            if (result?.errors) {
                if (result.errors.description) setError('description', { message: result.errors.description[0] });
                if (result.errors.class_id) setError('class_id', { message: result.errors.class_id[0] });
                if (result.errors.due_date) setError('due_date', { message: result.errors.due_date[0] });

                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: result.message || "Form alanlarını kontrol ediniz."
                });
            } else if (result?.message === 'Ödev başarıyla oluşturuldu') {
                setSuccess(true);
                toast({
                    title: "Başarılı",
                    description: result.message,
                });

                // Redirect user after short delay
                setTimeout(() => {
                    router.push('/teacher/homework');
                }, 2000);
            } else if (result?.message) {
                toast({
                    variant: "destructive",
                    title: "İşlem Başarısız",
                    description: result.message
                });
            } else {
                // Fallback success logic if actions.ts behavior changes
                setSuccess(true);
            }
        });
    }

    if (success) {
        return (
            <Card className="border-green-100 bg-green-50 dark:bg-green-900/20 dark:border-green-900 h-96 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                <div className="bg-green-100 dark:bg-green-800 p-3 rounded-full mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">Başarılı!</h3>
                <p className="text-green-700 dark:text-green-400">Ödev başarıyla oluşturuldu.</p>
                <p className="text-sm text-green-600 dark:text-green-500 mt-2">Yönlendiriliyorsunuz...</p>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                    <CardTitle>Ödev Detayları</CardTitle>
                    <CardDescription>Ödev içeriğini ve teslim tarihini belirleyin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="space-y-2">
                        <Label htmlFor="class_id">Sınıf Seçimi</Label>
                        <Controller
                            control={control}
                            name="class_id"
                            render={({ field }) => (
                                <div className="relative">
                                    <select
                                        className={cn(
                                            "flex h-10 w-full appearance-none items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                            errors.class_id && "border-red-500 focus:ring-red-500"
                                        )}
                                        {...field}
                                        value={field.value || ""}
                                        id="class_id"
                                    >
                                        <option value="" disabled>Bir sınıf seçin</option>
                                        {classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                                </div>
                            )}
                        />
                        {errors.class_id && (
                            <p className="text-sm font-medium text-red-500">{errors.class_id.message}</p>
                        )}
                    </div>

                    {/* Assignment Mode Selection */}
                    {selectedClassId && (
                        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <Label>Ödev Atama Türü</Label>
                            <Controller
                                control={control}
                                name="assignment_mode"
                                render={({ field }) => (
                                    <div className="space-y-3" role="radiogroup">

                                        {/* Option 1: Entire Class */}
                                        <div
                                            className={cn(
                                                "flex items-center space-x-3 p-3 rounded-md border transition-colors cursor-pointer",
                                                field.value === "entire_class"
                                                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                                            )}
                                            onClick={() => field.onChange("entire_class")}
                                        >
                                            <input
                                                type="radio"
                                                id="entire_class"
                                                name="assignment_mode"
                                                value="entire_class"
                                                checked={field.value === "entire_class"}
                                                onChange={() => field.onChange("entire_class")}
                                                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-primary"
                                            />
                                            <Label htmlFor="entire_class" className="flex items-center gap-2 cursor-pointer flex-1 user-select-none">
                                                <Users className="w-4 h-4 text-indigo-600" />
                                                <span className="font-medium">Tüm Sınıf</span>
                                                <span className="text-sm text-slate-500">({students.length} öğrenci)</span>
                                            </Label>
                                        </div>

                                        {/* Option 2: Selected Students */}
                                        <div
                                            className={cn(
                                                "flex items-center space-x-3 p-3 rounded-md border transition-colors cursor-pointer",
                                                field.value === "selected_students"
                                                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                                            )}
                                            onClick={() => field.onChange("selected_students")}
                                        >
                                            <input
                                                type="radio"
                                                id="selected_students"
                                                name="assignment_mode"
                                                value="selected_students"
                                                checked={field.value === "selected_students"}
                                                onChange={() => field.onChange("selected_students")}
                                                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-primary"
                                            />
                                            <Label htmlFor="selected_students" className="flex items-center gap-2 cursor-pointer flex-1 user-select-none">
                                                <UserCheck className="w-4 h-4 text-emerald-600" />
                                                <span className="font-medium">Öğrenci Seç</span>
                                                <span className="text-sm text-slate-500">
                                                    (Sadece seçili öğrencilere)
                                                </span>
                                            </Label>
                                        </div>

                                    </div>
                                )}
                            />

                            {/* Student Selection List */}
                            {assignmentMode === 'selected_students' && (
                                <div className="mt-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-sm font-semibold">Öğrencileri Seç</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={selectAllStudents}
                                                className="h-7 text-xs"
                                            >
                                                Tümünü Seç
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={deselectAllStudents}
                                                className="h-7 text-xs"
                                            >
                                                Temizle
                                            </Button>
                                        </div>
                                    </div>

                                    {loadingStudents ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                        </div>
                                    ) : students.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-4">Bu sınıfta öğrenci bulunmamaktadır.</p>
                                    ) : (
                                        <div className="max-h-64 overflow-y-auto space-y-2 p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                                            {students.map((student) => (
                                                <div
                                                    key={student.id}
                                                    className={cn(
                                                        "flex items-center space-x-3 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer",
                                                        selectedStudents.includes(student.id) && "bg-blue-50 dark:bg-blue-900/20"
                                                    )}
                                                    onClick={(e) => {
                                                        // Prevent double toggling if clicking directly on the input
                                                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                                                            toggleStudent(student.id);
                                                        }
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(student.id)}
                                                        onChange={() => toggleStudent(student.id)}
                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-primary"
                                                    />
                                                    <Label className="flex-1 cursor-pointer font-normal user-select-none">
                                                        {student.full_name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="due_date">Son Teslim Tarihi</Label>
                        <Controller
                            control={control}
                            name="due_date"
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground",
                                                errors.due_date && "border-red-500 text-red-500"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: tr })
                                            ) : (
                                                <span>Tarih seçin</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                            locale={tr}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                        {errors.due_date && (
                            <p className="text-sm font-medium text-red-500">{errors.due_date.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Ödev Açıklaması / Konu</Label>
                        <Controller
                            control={control}
                            name="description"
                            render={({ field }) => (
                                <Textarea
                                    id="description"
                                    placeholder="Ödevin içeriğini ve gereksinimlerini buraya yazın..."
                                    className={cn("min-h-[120px]", errors.description && "border-red-500 focus:ring-red-500")}
                                    {...field}
                                />
                            )}
                        />
                        {errors.description && (
                            <p className="text-sm font-medium text-red-500">{errors.description.message}</p>
                        )}
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t bg-slate-50 dark:bg-slate-900/50 p-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        disabled={isPending}
                    >
                        İptal
                    </Button>
                    <Button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Ödevi Yayınla
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
