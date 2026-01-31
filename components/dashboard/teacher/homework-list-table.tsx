"use client"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Calendar, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

interface Assignment {
    id: string;
    description: string;
    due_date: string;
    classes: {
        name: string;
    } | null;
}

interface HomeworkListTableProps {
    assignments: Assignment[];
}

export default function HomeworkListTable({ assignments }: HomeworkListTableProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            const { error, count } = await supabase
                .from('homework')
                .delete({ count: 'exact' }) // Get count of deleted rows
                .eq('id', id);

            if (error) {
                console.error("Supabase Error:", error);
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: "Silme hatası: " + error.message,
                });
                return;
            }

            if (count === 0) {
                console.warn("No rows deleted. RLS might be blocking or ID mismatch.");
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: "Ödev silinemedi! Yetkiniz olmayabilir veya ödev zaten silinmiş."
                });
            } else {
                toast({
                    title: "Başarılı",
                    description: "Ödev başarıyla silindi.",
                    variant: "default",
                    className: "bg-green-50 border-green-200"
                });
                router.refresh();
            }

        } catch (error: any) {
            console.error("Catch Error:", error);
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Silme işlemi başarısız: " + error.message
            });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ödev Başlığı</TableHead>
                    <TableHead>Sınıf</TableHead>
                    <TableHead>Son Teslim Tarihi</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {assignments.length > 0 ? (
                    assignments.map((hw) => {
                        const isPast = new Date(hw.due_date) < new Date();
                        return (
                            <TableRow key={hw.id}>
                                <TableCell className="font-medium max-w-xs truncate" title={hw.description}>
                                    {hw.description}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{hw.classes?.name}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                        {format(new Date(hw.due_date), "d MMM yyyy", { locale: tr })}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={isPast ? 'secondary' : 'default'} className={isPast ? '' : 'bg-green-600 hover:bg-green-700'}>
                                        {isPast ? 'Süresi Doldu' : 'Aktif'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {/* Edit Button */}
                                        <Link href={`/teacher/homework/${hw.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </Link>

                                        {/* Delete Dialog */}
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600">
                                                    {isDeleting === hw.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Ödevi Sil</DialogTitle>
                                                    <DialogDescription>
                                                        Bu ödevi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button variant="ghost">İptal</Button>
                                                    </DialogClose>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => handleDelete(hw.id)}
                                                        disabled={!!isDeleting}
                                                    >
                                                        Sil
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                            Henüz ödev kaydı oluşturulmamış.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
