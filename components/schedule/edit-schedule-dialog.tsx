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
import { useToast } from "@/components/ui/use-toast";
import { updateScheduleItem, deleteScheduleItem, ScheduleFormData } from '@/lib/actions/schedule';
import { Loader2 } from 'lucide-react';

interface Option {
    id: string;
    label: string;
    branchId?: string;
}

interface EditScheduleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: any; // The event object from FullCalendar
    teachers: Option[];
    courses: Option[];
    classes: Option[];
}

export function EditScheduleDialog({ open, onOpenChange, event, teachers, courses, classes }: EditScheduleDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState<ScheduleFormData>({
        day_of_week: 1,
        start_time: '',
        end_time: '',
        course_id: '',
        teacher_id: '',
        class_id: '',
        room_name: ''
    });

    useEffect(() => {
        if (event) {
            setFormData({
                day_of_week: event.day_of_week,
                start_time: event.start_time?.slice(0, 5) || '',
                end_time: event.end_time?.slice(0, 5) || '',
                course_id: event.course_id,
                teacher_id: event.teacher_id,
                class_id: event.class_id,
                room_name: event.room_name || ''
            });
        }
    }, [event]);

    // Filter teachers based on selected course branch ID
    const selectedCourse = courses.find(c => c.id === formData.course_id);
    const filteredTeachers = selectedCourse
        ? teachers.filter(t => t.branchId && t.branchId === selectedCourse.branchId)
        : teachers;

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartTime = e.target.value;
        const updatedFormData = { ...formData, start_time: newStartTime };

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

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await updateScheduleItem(event.id, formData);
            if (result.success) {
                toast({
                    description: "Ders güncellendi."
                });
                onOpenChange(false);
            } else {
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: result.error
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Hata oluştu."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Bu dersi silmek istediğinize emin misiniz?")) return;

        setIsDeleting(true);
        try {
            const result = await deleteScheduleItem(event.id);
            if (result.success) {
                toast({
                    description: "Ders silindi."
                });
                onOpenChange(false);
            } else {
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: result.error
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Hata oluştu."
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ders Düzenle</DialogTitle>
                    <DialogDescription>
                        Ders bilgilerini güncelleyin veya silin.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="grid gap-4 py-4">
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
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Öğretmen Seç" />
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

                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting || isLoading}>
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dersi Sil'}
                        </Button>
                        <Button type="submit" disabled={isLoading || isDeleting}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Güncelle'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
