'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Teacher } from '@/types/teacher';

export interface TeacherDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teacher?: Teacher | null;
    branches: string[];
    onSuccess?: () => void;
}

export default function TeacherDialog({ open, onOpenChange, teacher, branches, onSuccess }: TeacherDialogProps) { // NOSONAR
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        fullName: '',
        branch: '',
        email: '',
        password: '',
        phone: '',
        title: '',
        bio: '',
    });

    // Effect to populate form when teacher changes
    useEffect(() => {
        if (teacher) {
            setFormData({
                fullName: teacher.full_name || '',
                branch: teacher.branches?.name || '',
                email: teacher.email || '',
                password: '', // Password not editable directly usually, or handled separately. Leaving empty.
                phone: teacher.phone || '',
                title: teacher.title || '',
                bio: teacher.bio || '',
            });
        } else {
            // Reset form if creating new
            setFormData({
                fullName: '',
                branch: '',
                email: '',
                password: '',
                phone: '',
                title: '',
                bio: '',
            });
        }
    }, [teacher, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = '/api/admin/users';
            const method = teacher ? 'PUT' : 'POST';
            const body = {
                ...formData,
                role: 'teacher',
                ...(teacher && { id: teacher.id })
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'İşlem başarısız oldu.');
            }

            toast.success(teacher ? 'Öğretmen güncellendi.' : 'Öğretmen başarıyla oluşturuldu.');
            onOpenChange(false);
            router.refresh();
            if (onSuccess) onSuccess();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const submitLabel = teacher ? 'Güncelle' : 'Kaydet';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{teacher ? 'Öğretmeni Düzenle' : 'Yeni Öğretmen Ekle'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input
                            id="name"
                            placeholder="Örn: Ahmet Yılmaz"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="branch">Branş</Label>
                        <Select
                            value={formData.branch}
                            onValueChange={(val) => setFormData({ ...formData, branch: val })}
                            required
                        >
                            <SelectTrigger id="branch">
                                <SelectValue placeholder="Branş Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.length > 0 ? (
                                    branches.map((branch) => (
                                        <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-slate-500 text-center">Branş bulunamadı.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="ornek@cervus.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                            id="phone"
                            placeholder="555 555 55 55"
                            maxLength={10}
                            value={formData.phone}
                            onChange={(e) => {
                                let val = e.target.value.replaceAll(/\D/g, '');
                                if (val.startsWith('0')) val = val.substring(1);
                                if (val.length > 10) val = val.substring(0, 10);
                                setFormData({ ...formData, phone: val });
                            }}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="title">Unvan</Label>
                        <Input
                            id="title"
                            placeholder="Örn: Uzman Matematik Öğretmeni"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bio">Biyografi</Label>
                        <Input
                            id="bio"
                            placeholder="Kısa özgeçmiş..."
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                    </div>
                    {!teacher && (
                        <div className="grid gap-2">
                            <Label htmlFor="password">Geçici Şifre</Label>
                            <Input
                                id="password"
                                type="text"
                                placeholder="Şifre belirleyin"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'İşleniyor...' : submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
