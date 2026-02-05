'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { addScheduleItem, ScheduleFormData } from '@/lib/actions/schedule';

interface Option {
    id: string;
    label: string;
    branchId?: string;
}

interface ManualSchedulerDialogProps {
    teachers: Option[];
    courses: Option[];
    classes: Option[];
}

export function ManualSchedulerDialog({ teachers, courses, classes }: ManualSchedulerDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<ScheduleFormData>({
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '09:40',
        course_id: '',
        teacher_id: '',
        class_id: '',
        room_name: ''
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setFormData(prev => ({
                ...prev,
                course_id: '',
                teacher_id: '',
                class_id: '',
                room_name: '',
                // Keep day/time defaults or reset them too? User asked for Ders, Sınıf, Öğretmen.
                // Resetting everything to default is safer for "new entry" feel.
                day_of_week: 1,
                start_time: '09:00',
                end_time: '09:40'
            }));
        }
    }, [open]);

    // Filter teachers based on selected course branch ID
    const selectedCourse = courses.find(c => c.id === formData.course_id);
    const filteredTeachers = selectedCourse
        ? teachers.filter(t => t.branchId && t.branchId === selectedCourse.branchId)
        : teachers;

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartTime = e.target.value;
        const updatedFormData = { ...formData, start_time: newStartTime };

        // Auto-calculate end time (40 mins later)
        if (newStartTime) {
            const [h, m] = newStartTime.split(':').map(Number);
            const date = new Date();
            date.setHours(h);
            date.setMinutes(m + 40);
            const newEndTime = date.toTimeString().slice(0, 5);
            updatedFormData.end_time = newEndTime;
        }

        setFormData(updatedFormData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const missingFields = [];
        if (!formData.course_id) missingFields.push("Ders");
        if (!formData.teacher_id) missingFields.push("Öğretmen");
        if (!formData.class_id) missingFields.push("Sınıf");
        if (!formData.start_time) missingFields.push("Başlangıç Saati");
        if (!formData.end_time) missingFields.push("Bitiş Saati");

        if (missingFields.length > 0) {
            toast({
                variant: "destructive",
                title: "Eksik Bilgi",
                description: `Lütfen şu alanları doldurunuz: ${missingFields.join(", ")}`
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await addScheduleItem(formData);
            if (result.success) {
                toast({
                    title: "Başarılı",
                    description: "Ders programı başarıyla eklendi."
                });
                setOpen(false);
                // Reset form? maybe keep some values for ease of entry
            } else {
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: result.error || "Bir hata oluştu."
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Beklenmedik bir hata oluştu."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Manuel Ekle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ders Ekle</DialogTitle>
                    <DialogDescription>
                        Ders programına manuel ekleme yapın.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Gün</Label>
                            <Select
                                value={formData.day_of_week.toString()}
                                onValueChange={(val) => setFormData({ ...formData, day_of_week: parseInt(val) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Pazartesi</SelectItem>
                                    <SelectItem value="2">Salı</SelectItem>
                                    <SelectItem value="3">Çarşamba</SelectItem>
                                    <SelectItem value="4">Perşembe</SelectItem>
                                    <SelectItem value="5">Cuma</SelectItem>
                                    <SelectItem value="6">Cumartesi</SelectItem>
                                    <SelectItem value="7">Pazar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Sınıf</Label>
                            <Select
                                value={formData.class_id}
                                onValueChange={(val) => setFormData({ ...formData, class_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sınıf Seç" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Başlangıç</Label>
                            <Input
                                type="time"
                                value={formData.start_time}
                                onChange={handleStartTimeChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Bitiş</Label>
                            <Input
                                type="time"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Ders</Label>
                        <Select
                            value={formData.course_id}
                            onValueChange={(val) => setFormData({ ...formData, course_id: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Ders Seç" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Öğretmen</Label>
                        <Select
                            value={formData.teacher_id}
                            onValueChange={(val) => setFormData({ ...formData, teacher_id: val })}
                            disabled={!formData.course_id && teachers.length > 0} // Optional: force course selection first
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={formData.course_id ? "Öğretmen Seç" : "Önce Ders Seçin"} />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredTeachers.length > 0 ? (
                                    filteredTeachers.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        Bu branşta öğretmen bulunamadı.
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Derslik / Oda (Opsiyonel)</Label>
                        <Input
                            value={formData.room_name || ''}
                            onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                            placeholder="Z-01"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Ekleniyor...' : 'Ekle'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
