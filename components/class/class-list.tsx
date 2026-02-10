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
import { getClasses, deleteClass } from "@/lib/actions/class";
import { ClassDialog } from "./class-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Class } from "@/types/database";

export function ClassList() {
    const { toast } = useToast();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [editClass, setEditClass] = useState<Class | null>(null);
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

    useEffect(() => {
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

    const handleEdit = (cls: Class) => {
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Sınıf ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Sınıf
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sınıf Adı</TableHead>
                            <TableHead>Kademe</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : classes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    Sınıf bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            classes.map((cls) => (
                                <TableRow key={cls.id}>
                                    <TableCell className="font-medium">{cls.name}</TableCell>
                                    <TableCell>{cls.grade_level}</TableCell>
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
                                                <DropdownMenuItem onClick={() => handleEdit(cls)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(cls.id)}
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

            <ClassDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                cls={editClass}
                onSave={handleSave}
            />
        </div>
    );
}
