'use client'

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    MoreHorizontal,
    Pencil,
    Trash,
    Plus,
    Loader2,
    GraduationCap,
    Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getClasses, deleteClass } from "@/lib/actions/class";
import { ClassDialog } from "./class-dialog";
import { useToast } from "@/components/ui/use-toast";
import { ClassWithCount } from "@/types/database";

// İlk veri server component'ten prop olarak gelir — CSR waterfall yok
interface ClassListProps {
    initialData?: ClassWithCount[];
}

export function ClassList({ initialData = [] }: ClassListProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [classes, setClasses] = useState<ClassWithCount[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const [editClass, setEditClass] = useState<ClassWithCount | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const loadClasses = async () => {
        setLoading(true);
        const res = await getClasses();
        if (res.success && res.data) {
            let data = res.data;
            if (search) {
                const lowerSearch = search.toLowerCase();
                data = data.filter(c => c.name.toLowerCase().includes(lowerSearch));
            }
            setClasses(data);
        } else {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Sınıf listesi alınamadı."
            });
        }
        setLoading(false);
    };

    // Arama değiştiğinde sunucudan yeniden çek
    useEffect(() => {
        if (search === "") {
            // İlk render'da initialData zaten var, arama temizlenince tekrar çek
            if (initialData.length > 0 && classes !== initialData) {
                loadClasses();
            }
            return;
        }
        const timer = setTimeout(() => {
            loadClasses();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async (id: string) => {
        if (!confirm("Bu sınıfı silmek istediğinize emin misiniz?")) return;

        const res = await deleteClass(id);
        if (res.success) {
            toast({ description: "Sınıf silindi." });
            loadClasses();
        } else {
            toast({
                variant: "destructive",
                title: "Hata",
                description: res.error
            });
        }
    };

    const handleEdit = (cls: ClassWithCount) => {
        setEditClass(cls);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditClass(null);
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        setIsDialogOpen(false);
        loadClasses();
    };

    // Öğrenci sayısını al (Supabase aggregate count)
    const getStudentCount = (cls: ClassWithCount): number => {
        return cls.profiles?.[0]?.count ?? 0;
    };

    return (
        <div className="space-y-5">
            {/* Üst Bar: Arama + Yeni Sınıf */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative max-w-sm flex-1">
                    <Input
                        placeholder="Sınıf adı ile ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </div>
                <Button
                    onClick={handleCreate}
                    className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm gap-2"
                >
                    <Plus className="h-4 w-4" /> Yeni Sınıf
                </Button>
            </div>

            {/* Tablo */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Sınıf</TableHead>
                            <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Kademe</TableHead>
                            <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Öğrenci Sayısı</TableHead>
                            <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-300">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                                </TableCell>
                            </TableRow>
                        ) : classes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-slate-400">
                                    Sınıf bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            classes.map((cls) => {
                                const studentCount = getStudentCount(cls);
                                return (
                                    <TableRow
                                        key={cls.id}
                                        className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 group"
                                        onClick={() => router.push(`/admin/classes/${cls.id}`)}
                                    >
                                        {/* Sınıf — İkon + Ad */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                                                    <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <span className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                                    {cls.name}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Kademe Badge */}
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-0 font-medium text-xs"
                                            >
                                                {cls.grade_level}. Sınıf
                                            </Badge>
                                        </TableCell>

                                        {/* Öğrenci Sayısı */}
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-slate-400" />
                                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                                    {studentCount}
                                                </span>
                                                <span className="text-xs text-slate-400">öğrenci</span>
                                            </div>
                                        </TableCell>

                                        {/* İşlemler */}
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <span className="sr-only">Menü aç</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Aksiyonlar</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(cls); }}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Düzenle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }}
                                                        className="text-red-600"
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Toplam bilgisi */}
            {!loading && classes.length > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 pt-1">
                    Toplam <span className="font-medium text-slate-700 dark:text-slate-200">{classes.length}</span> sınıf
                </p>
            )}

            <ClassDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                cls={editClass}
                onSave={handleSave}
            />
        </div>
    );
}
