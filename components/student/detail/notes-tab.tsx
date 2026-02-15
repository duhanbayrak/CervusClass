'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface StudentNotesTabProps {
    role: 'admin' | 'teacher';
}

export function StudentNotesTab({ role }: StudentNotesTabProps) {
    return (
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardHeader>
                <CardTitle>Öğretmen Notları</CardTitle>
                <CardDescription>Bu öğrenci hakkında alınan özel notlar</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-12 text-slate-400">
                    <div className="inline-flex p-4 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-4">
                        <Pencil className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="text-sm">Henüz not girilmemiş.</p>
                    {role === 'teacher' && (
                        <Button variant="outline" className="mt-4 gap-2">
                            <Pencil className="w-4 h-4" />
                            Yeni Not Ekle
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
