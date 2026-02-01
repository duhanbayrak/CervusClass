"use client"

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, CheckCircle2, ChevronsUpDown, Check } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { createHomework } from '@/app/teacher/(portal)/homework/actions';
import { createBrowserClient } from '@supabase/ssr';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ClassItem {
    id: string;
    name: string;
}

interface StudentItem {
    id: string;
    full_name: string;
    avatar_url: string | null;
}

interface CreateAssignmentFormProps {
    classes: ClassItem[];
    userId: string;
    organizationId: string;
}

const formSchema = z.object({
    description: z.string().min(3, { message: "Ödev açıklaması en az 3 karakter olmalıdır." }),
    class_id: z.string().min(1, { message: "Lütfen bir sınıf seçiniz." }),
    due_date: z.date(),
    target_students: z.array(z.string()),
    is_personal: z.boolean(),
}).refine((data) => {
    if (data.is_personal && data.target_students.length === 0) {
        return false;
    }
    return true;
}, {
    message: "Kişiye özel ödev için en az bir öğrenci seçmelisiniz.",
    path: ["target_students"],
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAssignmentForm({ classes, userId, organizationId }: CreateAssignmentFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);

    // State for students in selected class
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    const { control, handleSubmit, setError, watch, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: "",
            class_id: "",
            is_personal: false,
            target_students: [],
        },
    });

    const selectedClassId = watch('class_id');
    const isPersonal = watch('is_personal');

    // Fetch students when class changes
    useEffect(() => {
        if (!selectedClassId) {
            setStudents([]);
            return;
        }

        const fetchStudents = async () => {
            setIsLoadingStudents(true);
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, class_id')
                .eq('class_id', selectedClassId)
                .order('full_name');

            if (error) {
                console.error("Error fetching students:", error);
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: "Öğrenci listesi alınamadı."
                });
            } else {
                setStudents(data || []);
            }
            setIsLoadingStudents(false);
        };

        fetchStudents();
        // Reset selection on class change
        setSelectedStudents([]);
        setValue('target_students', []);
        setValue('is_personal', false);

    }, [selectedClassId, toast, setValue]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('description', values.description);
            formData.append('class_id', values.class_id);
            formData.append('due_date', values.due_date.toISOString());
            formData.append('teacher_id', userId);
            formData.append('organization_id', organizationId);

            // If personalized, append student IDs
            if (values.is_personal && selectedStudents.length > 0) {
                formData.append('target_students', JSON.stringify(selectedStudents));
            }

            const result = await createHomework(undefined, formData);

            if (result?.errors) {
                if (result.errors.description) setError('description', { message: result.errors.description[0] });
                if (result.errors.class_id) setError('class_id', { message: result.errors.class_id[0] });
                if (result.errors.due_date) setError('due_date', { message: result.errors.due_date[0] });
                // Check for other errors too if needed

                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: result.message || "Form alanlarını kontrol ediniz."
                });
            } else if (result?.message && !result.errors) {
                toast({
                    variant: "destructive",
                    title: "İşlem Başarısız",
                    description: result.message
                });
            } else {
                setSuccess(true);
                toast({
                    title: "Başarılı",
                    description: "Ödev başarıyla oluşturuldu.",
                });
            }
        });
    }

    const toggleStudent = (studentId: string) => {
        const current = [...selectedStudents];
        const index = current.indexOf(studentId);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(studentId);
        }
        setSelectedStudents(current);
        setValue('target_students', current);

        // Auto-switch radio logic if needed, but manual switch is clearer
        if (current.length > 0 && !isPersonal) {
            setValue('is_personal', true);
        } else if (current.length === 0 && isPersonal) {
            // Maybe keep it personal but empty? Or switch back? Let's keep it manual.
        }
    };

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
                    <CardDescription>Ödev içeriğini, sınıfı ve teslim tarihini belirleyin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="space-y-2">
                        <Label htmlFor="class_id">Sınıf Seçimi</Label>
                        <Controller
                            control={control}
                            name="class_id"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger id="class_id" className={cn(errors.class_id && "border-red-500 focus:ring-red-500")}>
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
                            )}
                        />
                        {errors.class_id && (
                            <p className="text-sm font-medium text-red-500">{errors.class_id.message}</p>
                        )}
                    </div>

                    {/* Student Selection Logic */}
                    {selectedClassId && (
                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <Label>Kimlere Atanacak?</Label>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-md border text-sm">
                                    <button
                                        type="button"
                                        onClick={() => { setValue('is_personal', false); setSelectedStudents([]); }}
                                        className={cn(
                                            "px-3 py-1 rounded-sm transition-all",
                                            !isPersonal ? "bg-indigo-100 text-indigo-700 font-medium" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Tüm Sınıf
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setValue('is_personal', true)}
                                        className={cn(
                                            "px-3 py-1 rounded-sm transition-all",
                                            isPersonal ? "bg-indigo-100 text-indigo-700 font-medium" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Özel Seçim
                                    </button>
                                </div>
                            </div>

                            {isPersonal && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
                                    {isLoadingStudents ? (
                                        <div className="flex items-center text-sm text-slate-500 p-2">
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Öğrenciler yükleniyor...
                                        </div>
                                    ) : (
                                        <Command className="border rounded-md max-h-[200px]">
                                            <CommandInput placeholder="Öğrenci ara..." />
                                            <CommandList>
                                                <CommandEmpty>Öğrenci bulunamadı.</CommandEmpty>
                                                <CommandGroup>
                                                    {students.map((student) => (
                                                        <CommandItem
                                                            key={student.id}
                                                            onSelect={() => toggleStudent(student.id)}
                                                            className="cursor-pointer"
                                                        >
                                                            <div className={cn(
                                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                selectedStudents.includes(student.id)
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "opacity-50 [&_svg]:invisible"
                                                            )}>
                                                                <Check className="h-4 w-4" />
                                                            </div>
                                                            <span>{student.full_name}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    )}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {selectedStudents.map(id => {
                                            const st = students.find(s => s.id === id);
                                            if (!st) return null;
                                            return (
                                                <Badge key={id} variant="secondary" className="text-xs">
                                                    {st.full_name}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleStudent(id); }}
                                                        className="ml-1 hover:text-red-500"
                                                    >
                                                        ×
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                        {selectedStudents.length === 0 && (
                                            <span className="text-xs text-amber-600 font-medium px-1">
                                                * Lütfen listeden en az bir öğrenci seçiniz.
                                            </span>
                                        )}
                                    </div>
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
                        disabled={isPending || (isPersonal && selectedStudents.length === 0)}
                    >
                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Ödevi Yayınla
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
