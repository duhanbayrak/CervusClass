'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function UserSelectionDialog({ open, onOpenChange }: UserSelectionDialogProps) {
    const router = useRouter();

    const handleSelect = (type: 'teacher' | 'student') => {
        onOpenChange(false);
        if (type === 'teacher') {
            router.push('/admin/teachers?action=create');
        } else {
            router.push('/admin/students?action=create');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Kullanıcı Ekle</DialogTitle>
                    <DialogDescription>
                        Eklemek istediğiniz kullanıcı tipini seçiniz.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <Button
                        variant="outline"
                        className="h-32 flex flex-col items-center justify-center gap-4 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:border-blue-400 transition-all border-2"
                        onClick={() => handleSelect('teacher')}
                    >
                        <BookOpen className="h-10 w-10 text-blue-500" />
                        <span className="font-semibold text-lg">Öğretmen</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-32 flex flex-col items-center justify-center gap-4 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 dark:hover:border-green-400 transition-all border-2"
                        onClick={() => handleSelect('student')}
                    >
                        <GraduationCap className="h-10 w-10 text-green-500" />
                        <span className="font-semibold text-lg">Öğrenci</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
