'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, MessageSquare, Trash2, Loader2, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { addStudentNote, deleteStudentNote } from '@/lib/actions/student-notes';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StudentNotesTabProps {
    role: 'admin' | 'teacher' | 'parent';
    notes: any[];
    studentId: string;
}

export function StudentNotesTab({ role, notes, studentId }: StudentNotesTabProps) {
    const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { toast } = useToast();

    const handleAddNote = async () => {
        if (!noteContent.trim()) return;

        setIsSubmitting(true);
        try {
            const result = await addStudentNote(studentId, noteContent);
            if (result.success) {
                toast({
                    description: "Not başarıyla eklendi.",
                });
                setIsAddNoteOpen(false);
                setNoteContent('');
            } else {
                toast({
                    title: "Hata",
                    description: result.error || "Not eklenirken bir sorun oluştu.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Hata",
                description: "Not eklenirken bir sorun oluştu.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;

        setIsDeleting(noteId);
        try {
            const result = await deleteStudentNote(noteId, studentId);
            if (result.success) {
                toast({
                    description: "Not başarıyla silindi.",
                });
            } else {
                toast({
                    title: "Hata",
                    description: result.error || "Not silinirken bir sorun oluştu.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Hata",
                description: "Not silinirken bir sorun oluştu.",
                variant: "destructive"
            });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle>Öğretmen Notları</CardTitle>
                    <CardDescription>Bu öğrenci hakkında alınan özel notlar</CardDescription>
                </div>
                {(role === 'teacher' || role === 'admin') && (
                    <Button onClick={() => setIsAddNoteOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Pencil className="w-4 h-4" />
                        Yeni Not Ekle
                    </Button>
                )}
            </CardHeader>
            <CardContent className="pt-4">
                {notes.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <div className="inline-flex p-4 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-4">
                            <MessageSquare className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-sm">Henüz not girilmemiş.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notes.map((note) => (
                            <div key={note.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-700">
                                            <AvatarImage src={note.teacher?.avatar_url} />
                                            <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">{note.teacher?.full_name?.substring(0, 2).toUpperCase() || 'O'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{note.teacher?.full_name || 'Bilinmeyen Öğretmen'}</p>
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(note.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    {(role === 'admin' || role === 'teacher') && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => handleDeleteNote(note.id)}
                                            disabled={isDeleting === note.id}
                                        >
                                            {isDeleting === note.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </Button>
                                    )}
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap pl-11">
                                    {note.content}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yeni Not Ekle</DialogTitle>
                        <DialogDescription>
                            Öğrenci hakkında diğer öğretmenlerin ve yöneticilerin görebileceği bir not ekleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Notunuzu buraya yazın..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="min-h-[120px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddNoteOpen(false)} disabled={isSubmitting}>İptal</Button>
                        <Button onClick={handleAddNote} disabled={!noteContent.trim() || isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Notu Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
