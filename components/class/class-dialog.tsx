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
import { addClass, updateClass, ClassFormData } from "@/lib/actions/class";
import { Class } from "@/types/database";

interface ClassDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cls: Class | null;
    onSave: () => void;
}

export function ClassDialog({ open, onOpenChange, cls, onSave }: ClassDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<ClassFormData>({
        name: "",
        grade_level: 9
    });

    useEffect(() => {
        if (cls) {
            setFormData({
                name: cls.name,
                grade_level: cls.grade_level
            });
        } else {
            setFormData({
                name: "",
                grade_level: 9
            });
        }
    }, [cls, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (cls) {
                const res = await updateClass(cls.id, formData);
                if (res.success) {
                    toast({ description: "Sınıf güncellendi." });
                    onSave();
                } else {
                    toast({ variant: "destructive", description: res.error });
                }
            } else {
                const res = await addClass(formData);
                if (res.success) {
                    toast({ description: "Sınıf eklendi." });
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
                    <DialogTitle>{cls ? "Sınıf Düzenle" : "Yeni Sınıf Ekle"}</DialogTitle>
                    <DialogDescription>
                        Sınıf bilgilerini giriniz.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Sınıf Adı (Örn: 9-A, 12-Sozel)</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="grade">Kademe</Label>
                        <Select
                            value={formData.grade_level.toString()}
                            onValueChange={(val) => setFormData({ ...formData, grade_level: parseInt(val) })}
                        >
                            <SelectTrigger id="grade">
                                <SelectValue placeholder="Kademe Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="9">9. Sınıf</SelectItem>
                                <SelectItem value="10">10. Sınıf</SelectItem>
                                <SelectItem value="11">11. Sınıf</SelectItem>
                                <SelectItem value="12">12. Sınıf</SelectItem>
                                <SelectItem value="13">Mezun</SelectItem>
                            </SelectContent>
                        </Select>
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
