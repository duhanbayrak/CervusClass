'use client'

import { useState, useEffect, useRef } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    MoreHorizontal,
    Pencil,
    Trash,
    Plus,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getStudents, deleteStudent } from "@/lib/actions/student";
import { getClasses } from "@/lib/actions/class";
import { StudentDialog } from "./student-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

import { Student } from "@/types/student";

// Sayfa başına gösterilecek öğrenci sayısı
const PAGE_SIZE = 20;

// İlk veri server component'ten prop olarak gelir — CSR waterfall yok
interface StudentListProps {
    initialData?: Student[];
    initialCount?: number;
}

export function StudentList({ initialData = [], initialCount = 0 }: StudentListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [students, setStudents] = useState<Student[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [classFilter, setClassFilter] = useState<string>("all");
    const [classList, setClassList] = useState<{ id: string; name: string }[]>([]);
    const isFirstRender = useRef(true);

    // Sayfalama state'leri
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(initialCount);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const [editStudent, setEditStudent] = useState<Student | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Sınıf listesini yükle (sayfa ilk açıldığında)
    useEffect(() => {
        const loadClasses = async () => {
            const res = await getClasses();
            if (res.success) {
                setClassList(res.data.map(c => ({ id: c.id, name: c.name })));
            }
        };
        loadClasses();
    }, []);

    const loadStudents = async (page: number = currentPage) => {
        setLoading(true);
        const selectedClass = classFilter === 'all' ? undefined : classFilter;
        const res = await getStudents(search, selectedClass, page, PAGE_SIZE);
        if (res.success && res.data) {
            // Assuming res.data is compatible, or we should validate. 
            // For now, removing double cast.
            setStudents(res.data as Student[]);
            setTotalCount(res.count ?? 0);
        } else {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Öğrenci listesi alınamadı."
            });
        }
        setLoading(false);
    };

    // Arama veya sınıf filtresi değiştiğinde ilk sayfaya dön ve yeniden yükle
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            setCurrentPage(1);
            loadStudents(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, classFilter]);

    // Sayfa değiştiğinde yeniden yükle (ilk render hariç)
    useEffect(() => {
        if (currentPage === 1 && students === initialData) return;
        loadStudents(currentPage);
    }, [currentPage]);

    // Check for action param to auto-open dialog
    useEffect(() => {
        if (searchParams.get('action') === 'create') {
            setEditStudent(null);
            setIsDialogOpen(true);
        }
    }, [searchParams]);

    const handleDelete = async (id: string) => {
        if (!confirm("Bu öğrenciyi silmek istediğinize emin misiniz?")) return;

        const res = await deleteStudent(id);
        if (res.success) {
            toast({ description: "Öğrenci silindi." });
            loadStudents(currentPage);
        } else {
            toast({
                variant: "destructive",
                title: "Hata",
                description: res.error
            });
        }
    };

    const handleEdit = (student: Student) => {
        setEditStudent(student);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditStudent(null);
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        setIsDialogOpen(false);
        loadStudents(currentPage);

        // Clear action param if exists
        if (searchParams.get('action') === 'create') {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('action');
            router.replace(`?${params.toString()}`);
        }
    };

    // Wrapper for open change to handle param cleanup
    const handleOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open && searchParams.get('action') === 'create') {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('action');
            router.replace(`?${params.toString()}`);
        }
    };

    // Sayfa değiştirme fonksiyonları
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Gösterilen aralık bilgisi
    const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

    return (
        <div className="space-y-5">
            {/* Üst Bar: Arama + Sınıf Filtresi + Yeni Öğrenci */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                    {/* Arama */}
                    <div className="relative flex-1 max-w-sm">
                        <Input
                            placeholder="İsim, öğrenci no veya email ile ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>

                    {/* Sınıf Filtresi */}
                    <Select value={classFilter} onValueChange={setClassFilter}>
                        <SelectTrigger className="w-[160px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                            <SelectValue placeholder="Sınıf seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Sınıflar</SelectItem>
                            {classList.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                    {cls.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={handleCreate}
                    className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm gap-2"
                >
                    <Plus className="h-4 w-4" /> Yeni Öğrenci
                </Button>
            </div>

            {/* Tablo */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Öğrenci No</TableHead>
                            <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Öğrenci</TableHead>
                            <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Sınıf</TableHead>
                            <TableHead className="hidden md:table-cell font-semibold text-slate-600 dark:text-slate-300">Email</TableHead>
                            <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-300">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                                </TableCell>
                            </TableRow>
                        ) : students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                                    Öğrenci bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            students.map((student, index) => (
                                <TableRow
                                    key={student.id}
                                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 group"
                                    onClick={() => router.push(`/admin/students/${student.id}`)}
                                >
                                    {/* Öğrenci No */}
                                    <TableCell>
                                        {student.student_number ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
                                                {student.student_number}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                        )}
                                    </TableCell>

                                    {/* Öğrenci — Avatar + İsim */}
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    {(student.full_name || '?').slice(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                                {student.full_name}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Sınıf Badge */}
                                    <TableCell>
                                        {student.class?.name ? (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-0 font-medium text-xs">
                                                {student.class.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                        )}
                                    </TableCell>

                                    {/* Email */}
                                    <TableCell className="hidden md:table-cell">
                                        {student.email ? (
                                            <span className="text-sm text-slate-500 dark:text-slate-400">{student.email}</span>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                        )}
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
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Aksiyonlar</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/students/${student.id}`} className="w-full cursor-pointer">
                                                        <span className="flex items-center">
                                                            <Pencil className="mr-2 h-4 w-4 opacity-0" />
                                                            Profil Görüntüle
                                                        </span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(student); }}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(student.id); }}
                                                    className="text-red-600"
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Sayfalama Kontrolleri */}
            {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    {/* Sol: Kayıt bilgisi */}
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Toplam <span className="font-medium text-slate-700 dark:text-slate-200">{totalCount}</span> öğrenci
                        {totalPages > 1 && (
                            <> · {rangeStart}–{rangeEnd} arası gösteriliyor</>
                        )}
                    </p>

                    {/* Sağ: Sayfa kontrolleri */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            {/* İlk Sayfa */}
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => goToPage(1)}
                                disabled={currentPage === 1 || loading}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>

                            {/* Önceki */}
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {/* Sayfa Numaraları */}
                            <div className="flex items-center gap-1 mx-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((page) => {
                                        // İlk, son ve mevcut sayfanın ±1 çevresini göster
                                        if (page === 1 || page === totalPages) return true;
                                        if (Math.abs(page - currentPage) <= 1) return true;
                                        return false;
                                    })
                                    .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                                        // Ara boşluklara "..." ekle
                                        if (idx > 0 && page - (arr[idx - 1]) > 1) {
                                            acc.push('ellipsis');
                                        }
                                        acc.push(page);
                                        return acc;
                                    }, [])
                                    .map((item, idx) =>
                                        item === 'ellipsis' ? (
                                            <span key={`ellipsis-${idx}`} className="px-1.5 text-sm text-slate-400">
                                                …
                                            </span>
                                        ) : (
                                            <Button
                                                key={item}
                                                variant={currentPage === item ? "default" : "outline"}
                                                size="icon"
                                                className="h-8 w-8 text-xs"
                                                onClick={() => goToPage(item)}
                                                disabled={loading}
                                            >
                                                {item}
                                            </Button>
                                        )
                                    )}
                            </div>

                            {/* Sonraki */}
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages || loading}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>

                            {/* Son Sayfa */}
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => goToPage(totalPages)}
                                disabled={currentPage === totalPages || loading}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <StudentDialog
                open={isDialogOpen}
                onOpenChange={handleOpenChange}
                student={editStudent}
                onSave={handleSave}
            />
        </div>
    );
}
