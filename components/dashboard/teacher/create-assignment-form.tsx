"use client"

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react';

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

interface ClassItem {
    id: string;
    name: string;
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
        required_error: "Lütfen son teslim tarihini seçiniz.",
        invalid_type_error: "Lütfen geçerli bir tarih seçiniz."
    }),
});

export default function CreateAssignmentForm({ classes, userId, organizationId }: CreateAssignmentFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);

    const { control, handleSubmit, setError, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: "",
            class_id: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('description', values.description);
            formData.append('class_id', values.class_id);
            formData.append('due_date', values.due_date.toISOString());
            formData.append('teacher_id', userId);
            formData.append('organization_id', organizationId);

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
