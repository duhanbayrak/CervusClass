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
import {
    MoreHorizontal,
    Pencil,
    Trash,
    Plus,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { getStudents, deleteStudent } from "@/lib/actions/student";
import { StudentDialog } from "./student-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Profile } from "@/types/database";

import { Student } from "@/types/student";

export function StudentList() {
    const { toast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Pagination state could be added here

    const [editStudent, setEditStudent] = useState<Student | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const loadStudents = async () => {
        setLoading(true);
        const res = await getStudents(search);
        if (res.success && res.data) {
            setStudents(res.data as unknown as Student[]);
        } else {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Öğrenci listesi alınamadı."
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        // Debounce could be good here
        const timer = setTimeout(() => {
            loadStudents();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async (id: string) => {
        if (!confirm("Bu öğrenciyi silmek istediğinize emin misiniz?")) return;

        const res = await deleteStudent(id);
        if (res.success) {
            toast({ description: "Öğrenci silindi." });
            loadStudents();
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
        loadStudents();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Öğrenci ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Öğrenci
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Öğrenci No</TableHead>
                            <TableHead>Ad Soyad</TableHead>
                            <TableHead>Sınıf</TableHead>
                            <TableHead className="hidden md:table-cell">Email</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Öğrenci bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            students.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.student_number || '-'}</TableCell>
                                    <TableCell className="font-medium">{student.full_name}</TableCell>
                                    <TableCell>{student.class?.name || '-'}</TableCell>
                                    <TableCell className="hidden md:table-cell">{student.email || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Aksiyonlar</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/students/${student.id}`} className="w-full cursor-pointer">
                                                        <span className="flex items-center">
                                                            <Pencil className="mr-2 h-4 w-4 opacity-0" /> {/* Spacer */}
                                                            Profil Görüntüle
                                                        </span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(student)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(student.id)}
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

            <StudentDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                student={editStudent}
                onSave={handleSave}
            />
        </div>
    );
}
