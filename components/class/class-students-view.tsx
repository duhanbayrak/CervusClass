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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getStudents } from "@/lib/actions/student";
import { Student } from "@/types/student";

// Sayfa başına gösterilecek öğrenci sayısı
const PAGE_SIZE = 20;

interface ClassStudentsViewProps {
    classId: string;
    className: string;
}

export function ClassStudentsView({ classId, className }: ClassStudentsViewProps) {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const loadStudents = async (page: number = currentPage) => {
        setLoading(true);
        const res = await getStudents({ search, classId, page, limit: PAGE_SIZE });
        if (res.success && res.data) {
            setStudents(res.data.students as unknown as Student[]);
            setTotalCount(res.data.count ?? 0);
        }
        setLoading(false);
    };

    // Arama değiştiğinde ilk sayfaya dön
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            loadStudents(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Sayfa değiştiğinde yeniden yükle
    useEffect(() => {
        loadStudents(currentPage);
    }, [currentPage]);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

    return (
        <div className="space-y-4">
            {/* Arama */}
            <div className="relative max-w-sm">
                <Input
                    placeholder="Öğrenci ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
            </div>

            {/* Tablo */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Öğrenci No</TableHead>
                            <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Öğrenci</TableHead>
                            <TableHead className="hidden md:table-cell font-semibold text-slate-600 dark:text-slate-300">Email</TableHead>
                            <TableHead className="hidden md:table-cell font-semibold text-slate-600 dark:text-slate-300">Telefon</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                                </TableCell>
                            </TableRow>
                        )}
                        {!loading && students.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-slate-400">
                                    {search ? "Aramayla eşleşen öğrenci bulunamadı." : "Bu sınıfta henüz öğrenci yok."}
                                </TableCell>
                            </TableRow>
                        )}
                        {!loading && students.length > 0 && students.map((student) => (
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

                                    {/* Email */}
                                    <TableCell className="hidden md:table-cell">
                                        {student.email ? (
                                            <span className="text-sm text-slate-500 dark:text-slate-400">{student.email}</span>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                        )}
                                    </TableCell>

                                    {/* Telefon */}
                                    <TableCell className="hidden md:table-cell">
                                        {student.phone ? (
                                            <span className="text-sm text-slate-500 dark:text-slate-400">{student.phone}</span>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Sayfalama */}
            {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Toplam <span className="font-medium text-slate-700 dark:text-slate-200">{totalCount}</span> öğrenci
                        {totalPages > 1 && (
                            <> · {rangeStart}–{rangeEnd} arası gösteriliyor</>
                        )}
                    </p>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => goToPage(1)}
                                disabled={currentPage === 1 || loading}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-1 mx-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((page) => {
                                        if (page === 1 || page === totalPages) return true;
                                        if (Math.abs(page - currentPage) <= 1) return true;
                                        return false;
                                    })
                                    .reduce<(number | string)[]>((acc, page, idx, arr) => {
                                        if (idx > 0 && page - Number(arr[idx - 1]) > 1) {
                                            acc.push(`ellipsis-${acc.length}`);
                                        }
                                        acc.push(page);
                                        return acc;
                                    }, [])
                                    .map((item) =>
                                        typeof item === 'string' ? (
                                            <span key={item} className="px-1.5 text-sm text-slate-400">…</span>
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

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages || loading}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
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
        </div>
    );
}
