'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Save, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Note {
    id: string;
    teacher_id: string;
    student_id: string;
    note: string;
    created_at: string;
}

interface StudentNotesProps {
    studentId: string;
}

export function StudentNotes({ studentId }: Readonly<StudentNotesProps>) { // NOSONAR
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, // NOSONAR
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // NOSONAR
    );

    useEffect(() => {
        fetchNotes();
    }, [studentId]);

    async function fetchNotes() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('teacher_notes')
                .select('*')
                .eq('student_id', studentId)
                .eq('teacher_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAddNote() {
        if (!newNote.trim()) return;

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('teacher_notes')
                .insert([
                    {
                        teacher_id: user.id,
                        student_id: studentId,
                        note: newNote.trim()
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setNotes([data, ...notes]);
            setNewNote('');
            setIsAdding(false);
        } catch (error) {
            console.error('Error adding note:', error);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteNote(id: string) {
        try {
            const { error } = await supabase
                .from('teacher_notes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setNotes(notes.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Öğretmen Notları</CardTitle>
                    <CardDescription>Bu öğrenci hakkında aldığınız özel notlar.</CardDescription>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" /> Not Ekle
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isAdding && (
                    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                        <Textarea
                            placeholder="Öğrenci hakkında notunuzu buraya yazın..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="mb-3 min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>iptal</Button>
                            <Button onClick={handleAddNote} disabled={isSaving || !newNote.trim()} size="sm" className="gap-2">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Kaydet
                            </Button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {notes.length > 0 ? (
                        notes.map((note) => (
                            <div key={note.id} className="group relative p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={() => handleDeleteNote(note.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.note}</p>
                                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{format(new Date(note.created_at), 'd MMMM yyyy, HH:mm', { locale: tr })}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        !isAdding && (
                            <div className="text-center py-12 text-slate-400">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Henüz not girilmemiş.</p>
                                <Button variant="link" onClick={() => setIsAdding(true)} className="mt-2 text-indigo-600">
                                    İlk notu ekleyin
                                </Button>
                            </div>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
