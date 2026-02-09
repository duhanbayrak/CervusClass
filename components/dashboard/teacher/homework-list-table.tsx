"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
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
    // Enriched props
    derivedStatus?: 'active' | 'completed' | 'expired';
    totalAssigned?: number;
    submissionCount?: number;
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HomeworkListTableProps {
    activeAssignments?: Assignment[];
    pastAssignments?: Assignment[];
    assignments?: Assignment[]; // Keep for backward compat or fallback
}

export default function HomeworkListTable({ activeAssignments = [], pastAssignments = [], assignments }: HomeworkListTableProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    // Fallback if old props passed (though we updated parent)
    const effectiveActive = assignments ? assignments : activeAssignments;
    const effectivePast = pastAssignments;

    // Only use tabs if we have split data. If only 'assignments' passed, use legacy view (or treat as active)
    const showTabs = activeAssignments.length > 0 || pastAssignments.length > 0 || (!assignments);

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

                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: "Silme hatası: " + error.message,
                });
                return;
            }

            if (count === 0) {

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

            toast({
                variant: "destructive",
                title: "Hata",
                description: "Silme işlemi başarısız: " + error.message
            });
        } finally {
            setIsDeleting(null);
        }
    };

    const renderTable = (list: Assignment[], emptyMessage: string) => (
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
                {list.length > 0 ? (
                    list.map((hw) => {
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
                                    <div className="flex flex-col gap-1">
                                        {hw.derivedStatus === 'completed' && (
                                            <Badge className="bg-blue-600 hover:bg-blue-700 w-fit">
                                                Tümü Tamamlandı
                                            </Badge>
                                        )}
                                        {hw.derivedStatus === 'expired' && (
                                            <Badge variant="secondary" className="w-fit">
                                                Süresi Doldu
                                            </Badge>
                                        )}
                                        {(!hw.derivedStatus || hw.derivedStatus === 'active') && (
                                            <Badge className="bg-green-600 hover:bg-green-700 w-fit">
                                                Aktif
                                            </Badge>
                                        )}

                                        {(hw.totalAssigned !== undefined) && (
                                            <span className="text-xs text-slate-500">
                                                {hw.submissionCount}/{hw.totalAssigned} Tamamlandı
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {/* Check/Review Button */}
                                        <Link href={`/teacher/homework/${hw.id}/check`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-green-600">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </Button>
                                        </Link>

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
                            {emptyMessage}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    if (!showTabs) {
        return renderTable(effectiveActive, "Henüz ödev kaydı oluşturulmamış.");
    }

    return (
        <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="active">Aktif Ödevler ({effectiveActive.length})</TabsTrigger>
                <TabsTrigger value="past">Geçmiş Ödevler ({effectivePast.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
                {renderTable(effectiveActive, "Aktif ödev bulunmuyor.")}
            </TabsContent>
            <TabsContent value="past">
                {renderTable(effectivePast, "Geçmiş ödev bulunmuyor.")}
            </TabsContent>
        </Tabs>
    );
}
