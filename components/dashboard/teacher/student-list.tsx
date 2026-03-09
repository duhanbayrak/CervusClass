"use client";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Search, Filter } from 'lucide-react';
// NOSONAR
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// NOSONAR
import Link from 'next/link';

interface Student {
    id: string;
    student_number?: string;
    full_name: string;
    email?: string;
    avatar_url: string | null;
    classes: {
        name: string;
    } | null;
    roles?: {
        name: string;
    } | null;
}

interface ClassItem {
    id: string;
    name: string;
}

interface StudentListProps {
    students: Student[];
    classes: ClassItem[];
}

export default function StudentList({ students, classes }: Readonly<StudentListProps>) {
    // NOSONAR
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter(); // Use full router for push

    // Local state for input
    const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '');
    const selectedClass = searchParams.get('class') || 'all';

    // Timer ref for debounce
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update URL on search with debounce
    const handleSearch = (term: string) => {
        setSearchTerm(term);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString()); // Create copy of current params

            if (term.length >= 3) {
                params.set('query', term);
            } else {
                params.delete('query');
            }

            // Keep class filter intact (using the params object which started as a clone of searchParams)
            // No need to manually reset 'class' unless we want to clear it on search.

            router.replace(`${pathname}?${params.toString()}`);
        }, 500); // 500ms debounce
    };

    // Update URL on class filter
    const handleClassChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value && value !== 'all') {
            params.set('class', value);
        } else {
            params.delete('class');
        }

        // Keep searching if searchTerm is valid in state
        if (searchTerm.length >= 3) {
            params.set('query', searchTerm);
        }

        router.replace(`${pathname}?${params.toString()}`);
    };

    const clearFilters = () => {
        setSearchTerm("");
        router.replace(pathname);
    };

    return (
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle>Öğrenci Listesi ({students.length})</CardTitle>
                        <CardDescription>Detaylı bilgileri görüntülemek için öğrenciye tıklayın.</CardDescription>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Öğrenci ara (en az 3 harf)..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    <Select value={selectedClass} onValueChange={handleClassChange}>
                        <SelectTrigger className="w-full sm:w-48">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-500" />
                                <SelectValue placeholder="Sınıf Seç" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Sınıflar</SelectItem>
                            {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.name}>
                                    {cls.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {(searchTerm || selectedClass !== 'all') && (
                        <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                            Filtreleri Temizle
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-slate-200 dark:border-slate-700">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Numara</TableHead>
                                <TableHead>Ad Soyad</TableHead>
                                <TableHead>Sınıf</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <TableRow
                                        key={student.id}
                                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                        onClick={() => router.push(`/teacher/students/${student.id}`)}
                                    >
                                        <TableCell className="font-medium font-mono">
                                            {student.student_number || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={student.avatar_url || undefined} alt={student.full_name} />
                                                    <AvatarFallback>{student.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span>{student.full_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-50">
                                                {student.classes?.name || 'Sınıfsız'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <span className="sr-only">Menü</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/teacher/students/${student.id}`} className="cursor-pointer w-full">
                                                            Profil Görüntüle
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>Not Gir</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                        Aradığınız kriterlere uygun öğrenci bulunamadı.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
