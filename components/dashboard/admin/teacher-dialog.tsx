'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Teacher } from '@/types/teacher';
import { TeacherFormFields } from './TeacherFormFields';
import type { TeacherFormData } from './TeacherFormFields';

export interface TeacherDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teacher?: Teacher | null;
    branches: string[];
    onSuccess?: () => void;
}

export default function TeacherDialog({ open, onOpenChange, teacher, branches, onSuccess }: Readonly<TeacherDialogProps>) {
 // NOSONAR
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState<TeacherFormData>({
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
                    <TeacherFormFields
                        formData={formData}
                        onChange={setFormData}
                        branches={branches}
                        isEditing={!!teacher}
                    />
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
