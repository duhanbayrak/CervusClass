'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import TeacherDialog from './teacher-dialog';

interface TeacherProfileEditButtonProps {
    teacher: any;
    branches: string[];
}

export default function TeacherProfileEditButton({ teacher, branches }: TeacherProfileEditButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Bilgileri Düzenle
            </Button>

            <TeacherDialog
                open={open}
                onOpenChange={setOpen}
                teacher={teacher}
                branches={branches}
            />
        </>
    );
}
