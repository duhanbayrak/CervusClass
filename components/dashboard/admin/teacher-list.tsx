'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Search, MoreHorizontal, Mail, BookOpen, Users } from 'lucide-react';
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
    phone: string | null;
    title: string | null;
    avatar_url: string | null;
    branch: string | null;
    created_at: string;
    bio?: string | null;
}

export default function TeacherList({ initialTeachers, initialBranches }: Readonly<{ initialTeachers: Teacher[], initialBranches: string[] }>) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [mounted, setMounted] = useState(false);

    // Delete Modal State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        setMounted(true);
        if (searchParams.get('action') === 'create') {
            setIsAddDialogOpen(true);
        }
    }, [searchParams]);

    // Form States
    const [formData, setFormData] = useState({
        fullName: '',
        branch: '',
        email: '',
        password: '',
        phone: '',
        title: '',
        bio: '',
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
            const url = '/api/admin/users';
            const method = editingTeacher ? 'PUT' : 'POST';
            const body = {
                ...formData,
                role: 'teacher',
                ...(editingTeacher && { id: editingTeacher.id })
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create teacher');
            }

            toast.success(editingTeacher ? 'Öğretmen güncellendi.' : 'Öğretmen başarıyla oluşturuldu.');
            setIsAddDialogOpen(false);
            setEditingTeacher(null);
            setFormData({ fullName: '', branch: '', email: '', password: '', phone: '', title: '', bio: '' });
            router.refresh();

            if (searchParams.get('action') === 'create') {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('action');
                router.replace(`?${params.toString()}`);
            }

        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Bilinmeyen bir hata oluştu');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = (id: string, name: string) => {
        setTeacherToDelete({ id, name });
        setDeleteDialogOpen(true);
    };

    const handleDeleteTeacher = async () => {
        if (!teacherToDelete) return;

        try {
            const response = await fetch(`/api/admin/users?id=${teacherToDelete.id}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete');
            }

            toast.success('Öğretmen silindi.');
            router.refresh();
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Bilinmeyen bir hata oluştu');
            }
        } finally {
            setDeleteDialogOpen(false);
            setTeacherToDelete(null);
        }
    };

    const handleEditClick = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        setFormData({
            fullName: teacher.full_name || '',
            branch: teacher.branch || '',
            email: teacher.email || '',
            password: '',
            phone: teacher.phone || '',
            title: teacher.title || '',
            bio: teacher.bio || '',
        });
        setIsAddDialogOpen(true);
    };

    const handleDialogOpenChange = (open: boolean) => {
        setIsAddDialogOpen(open);
        if (!open) {
            setEditingTeacher(null);
            setFormData({ fullName: '', branch: '', email: '', password: '', phone: '', title: '', bio: '' });

            if (searchParams.get('action') === 'create') {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('action');
                router.replace(`?${params.toString()}`);
            }
        }
    };

    if (!mounted) {
        return null;
    }

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

                <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto bg-[#135bec] hover:bg-blue-700" onClick={() => setEditingTeacher(null)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Öğretmen Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingTeacher ? 'Öğretmeni Düzenle' : 'Yeni Öğretmen Oluştur'}</DialogTitle>
                            <DialogDescription>
                                {editingTeacher ? 'Öğretmen bilgilerini güncelleyin.' : 'Sisteme giriş yapabilmesi için öğretmenin bilgilerini giriniz.'}
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
                                <Label htmlFor="phone">Telefon</Label>
                                <Input
                                    id="phone"
                                    placeholder="555 555 55 55"
                                    maxLength={10}
                                    value={formData.phone}
                                    onChange={(e) => {
                                        let val = e.target.value.replaceAll(/\D/g, '');
                                        if (val.startsWith('0')) val = val.substring(1);
                                        if (val.length > 10) val = val.substring(0, 10);
                                        setFormData({ ...formData, phone: val });
                                    }}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="title">Unvan</Label>
                                <Input
                                    id="title"
                                    placeholder="Örn: Uzman Matematik Öğretmeni"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bio">Biyografi</Label>
                                <Input
                                    id="bio"
                                    placeholder="Kısa özgeçmiş..."
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                            {!editingTeacher && (
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
                            )}
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {(() => {
                                        if (isLoading) return 'İşleniyor...';
                                        if (editingTeacher) return 'Güncelle';
                                        return 'Kaydet';
                                    })()}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* DELETE ALERT DIALOG */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {teacherToDelete?.name} isimli öğretmeni silmek istediğinize emin misiniz? Bu işlem geri alınamaz (soft delete).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeacher();
                        }}>
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
                                <TableRow
                                    key={teacher.id}
                                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 group"
                                    onClick={() => router.push(`/admin/teachers/${teacher.id}`)}
                                >
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
                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/admin/teachers/${teacher.id}`)}>
                                                    <Users className="mr-2 h-4 w-4" /> Profili Görüntüle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEditClick(teacher)}>
                                                    <BookOpen className="mr-2 h-4 w-4" /> Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(teacher.email || ''); }}>
                                                    <Mail className="mr-2 h-4 w-4" /> E-posta Kopyala
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => {
                                                    e.stopPropagation();
                                                    confirmDelete(teacher.id, teacher.full_name || 'Öğretmen');
                                                }}>
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
