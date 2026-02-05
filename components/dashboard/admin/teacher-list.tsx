'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Search, MoreHorizontal, Mail, BookOpen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Teacher {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    branch: string | null;
    created_at: string;
}

export default function TeacherList({ initialTeachers, initialBranches }: { initialTeachers: Teacher[], initialBranches: string[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        fullName: '',
        branch: '',
        email: '',
        password: '',
    });

    const filteredTeachers = initialTeachers.filter(teacher =>
        (teacher.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (teacher.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (teacher.branch?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    role: 'teacher'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create teacher');
            }

            toast.success('Öğretmen başarıyla oluşturuldu.');
            setIsAddDialogOpen(false);
            setFormData({ fullName: '', branch: '', email: '', password: '' });
            router.refresh();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTeacher = async (id: string, name: string) => {
        if (!confirm(`${name} isimli öğretmeni silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;

        try {
            // In a real app we might want to just soft-delete or check for dependencies (classes, etc.)
            const response = await fetch(`/api/admin/users?id=${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete');
            }

            toast.success('Öğretmen silindi.');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-6">

            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Öğretmen ara..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto bg-[#135bec] hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Öğretmen Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Öğretmen Oluştur</DialogTitle>
                            <DialogDescription>
                                Sisteme giriş yapabilmesi için öğretmenin bilgilerini giriniz.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddTeacher} className="space-y-4 pt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Ad Soyad</Label>
                                <Input
                                    id="name"
                                    placeholder="Örn: Ahmet Yılmaz"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="branch">Branş</Label>
                                <Select
                                    value={formData.branch}
                                    onValueChange={(val) => setFormData({ ...formData, branch: val })}
                                    required
                                >
                                    <SelectTrigger id="branch">
                                        <SelectValue placeholder="Branş Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {initialBranches.length > 0 ? (
                                            initialBranches.map((branch) => (
                                                <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-sm text-slate-500 text-center">Branş bulunamadı.</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">E-posta</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="ornek@cervus.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Geçici Şifre</Label>
                                <Input
                                    id="password"
                                    type="text"
                                    placeholder="Şifre belirleyin"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Oluşturuluyor...' : 'Kaydet'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* List */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                        <TableRow>
                            <TableHead className="w-[80px]">Avatar</TableHead>
                            <TableHead>Ad Soyad</TableHead>
                            <TableHead className="hidden md:table-cell">E-posta</TableHead>
                            <TableHead>Branş</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map((teacher) => (
                                <TableRow key={teacher.id}>
                                    <TableCell>
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={teacher.avatar_url || ''} />
                                            <AvatarFallback>{teacher.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {teacher.full_name}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-slate-500">
                                        {teacher.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal">
                                            {teacher.branch || 'Genel'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(teacher.email || '')}>
                                                    <Mail className="mr-2 h-4 w-4" /> E-posta Kopyala
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteTeacher(teacher.id, teacher.full_name || 'Öğretmen')}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                    Öğretmen bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-xs text-slate-400 text-center">
                Toplam {filteredTeachers.length} öğretmen listeleniyor.
            </div>
        </div>
    );
}
