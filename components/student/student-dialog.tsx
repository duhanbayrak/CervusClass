'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { addStudent, updateStudent, StudentFormData } from "@/lib/actions/student";
import { Student } from "@/types/student";

// For now, let's pass classes as prop or fetch them inside.
// Ideally, props is cleaner, but to make StudentList self-contained, we might fetch there or here.
// Let's create a getClasses server action or use client side fetch? 
// We generally use server actions now. But `StudentList` is a client component. 
// Let's assume we can fetch classes in `StudentList` and pass them down, OR
// fetch inside the dialog on mount.

import { getClasses } from "@/lib/actions/class";

interface StudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: Student | null;
    onSave: () => void;
}

export function StudentDialog({ open, onOpenChange, student, onSave }: StudentDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);

    // Form state
    const [formData, setFormData] = useState<StudentFormData>({
        full_name: "",
        email: "",
        class_id: "",
        password: ""
    });

    useEffect(() => {
        // Fetch classes
        const fetchClasses = async () => {
            const res = await getClasses();
            if (res.success && res.data) {
                setClasses(res.data);
            } else {
                console.error("Failed to fetch classes:", res.error);
                // Optionally toast error?
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (student) {
            setFormData({
                full_name: student.full_name || "",
                email: student.email || "",
                class_id: student.class_id || "",
                password: "" // Don't show password
            });
        } else {
            setFormData({
                full_name: "",
                email: "",
                class_id: "",
                password: ""
            });
        }
    }, [student, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (student) {
                const res = await updateStudent(student.id, formData);
                if (res.success) {
                    toast({ description: "Öğrenci güncellendi." });
                    onSave();
                } else {
                    toast({ variant: "destructive", description: res.error });
                }
            } else {
                const res = await addStudent(formData);
                if (res.success) {
                    toast({ description: "Öğrenci eklendi." });
                    onSave();
                } else {
                    toast({ variant: "destructive", description: res.error });
                }
            }
        } catch (error) {
            toast({ variant: "destructive", description: "Bir hata oluştu." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{student ? "Öğrenci Düzenle" : "Yeni Öğrenci Ekle"}</DialogTitle>
                    <DialogDescription>
                        Öğrenci bilgilerini giriniz.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input
                            id="name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="class">Sınıf</Label>
                        <Select
                            value={formData.class_id}
                            onValueChange={(val) => setFormData({ ...formData, class_id: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sınıf Seç" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Şifre {student && "(Boş bırakırsanız değişmez)"}</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!student}
                            minLength={6}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
