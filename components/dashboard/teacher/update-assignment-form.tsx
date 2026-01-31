"use client"

import { useState } from 'react';
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

interface ClassItem {
    id: string;
    name: string;
}

interface UpdateAssignmentFormProps {
    assignment: {
        id: string;
        description: string;
        class_id: string;
        due_date: string;
    };
    classes: ClassItem[];
    userId: string;
}

export default function UpdateAssignmentForm({ assignment, classes, userId }: UpdateAssignmentFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State populated from assignment
    const [description, setDescription] = useState(assignment.description);
    // Be careful, class_id must exist in classes list
    const [classId, setClassId] = useState(assignment.class_id);
    const [date, setDate] = useState<Date | undefined>(new Date(assignment.due_date));

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description || !classId || !date) {
            alert("Lütfen tüm alanları doldurunuz.");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase
                .from('homework')
                .update({
                    description: description,
                    class_id: classId,
                    due_date: date.toISOString(),
                })
                .eq('id', assignment.id)
                .eq('teacher_id', userId); // Ensure security

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
