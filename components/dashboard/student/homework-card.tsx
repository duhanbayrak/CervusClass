"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { startTransition, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { submitHomework } from "@/lib/actions/student-homework"
import { toast } from "sonner"
import { CheckCircle, XCircle, Clock, Send, AlertTriangle } from 'lucide-react'

interface HomeworkCardProps {
    hw: any
    status: 'pending' | 'past'
    referenceDate: Date // Passed from server to ensure hydration match
}

export function HomeworkCard({ hw, status, referenceDate }: HomeworkCardProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition();

    const dueDate = new Date(hw.due_date);
    const now = referenceDate;
    // Adjusted urgent logic: only if pending and close to deadline
    const isUrgent = hw.submission_status === 'pending' && (dueDate.getTime() - now.getTime()) < (3 * 24 * 60 * 60 * 1000) && (dueDate.getTime() > now.getTime());
    const isOverdue = hw.submission_status === 'pending' && dueDate.getTime() < now.getTime();

    const handleSubmit = async () => {
        startTransition(async () => {
            const result = await submitHomework(hw.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Ödev teslim edildi! Öğretmen onayı bekleniyor.");
                setOpen(false);
            }
        });
    }

    const getStatusBadge = () => {
        switch (hw.submission_status) {
            case 'approved':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Onaylandı</Badge>
            case 'rejected':
                return <Badge variant="destructive">Reddedildi/Yapılmadı</Badge>
            case 'submitted':
                return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">İnceleniyor</Badge>
            default:
                if (isOverdue) return <Badge variant="destructive">Süresi Geçti</Badge>
                if (isUrgent) return <Badge variant="destructive" className="animate-pulse">Acele Et</Badge>
                return <Badge variant="secondary">Bekliyor</Badge>
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Card className={`border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-300 transition-colors flex flex-col cursor-pointer bg-white text-left h-full ${status === 'past' ? 'opacity-90' : ''
                    }`}>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            {getStatusBadge()}
                            <span className="text-xs text-slate-400 font-medium">
                                {status === 'pending' ? 'Son Teslim:' : 'Bitiş:'} {dueDate.toLocaleDateString('tr-TR')}
                            </span>
                        </div>
                        <CardTitle className="text-base line-clamp-2 mt-2">{hw.description}</CardTitle>
                        <CardDescription className="text-xs">
                            {hw.teacher?.full_name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end pt-0">
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                            <span className="text-blue-500 hover:underline">Detaylı açıklama ve işlem için tıklayın.</span>
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-3 mt-auto">
                            <Clock className="w-3 h-3" />
                            <span>{dueDate.getHours()}:{String(dueDate.getMinutes()).padStart(2, '0')}'a kadar</span>
                        </div>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Ödev Detayı</span>
                        {getStatusBadge()}
                    </DialogTitle>
                    <DialogDescription>
                        {hw.teacher?.full_name} tarafından verildi - Son Teslim: {dueDate.toLocaleDateString('tr-TR')}
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md text-sm whitespace-pre-wrap">
                        {hw.description}
                    </div>

                    {hw.submission_status === 'pending' && !isOverdue && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 dark:border-blue-800">
                            {hw.teacher_feedback && (
                                <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200">
                                    <p className="text-sm font-semibold flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Öğretmen Revizyon Talebi:
                                    </p>
                                    <p className="text-sm mt-1">{hw.teacher_feedback}</p>
                                </div>
                            )}
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Ödevi Tamamladın mı?</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                                Ödevi tamamladıysan aşağıdaki butona tıklayarak öğretmenine bildirebilirsin.
                            </p>
                            <Button onClick={handleSubmit} isLoading={isPending} className="w-full bg-blue-600 hover:bg-blue-700">
                                Ödevi Tamamladım
                            </Button>
                        </div>
                    )}

                    {hw.submission_status === 'submitted' && (
                        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100 text-yellow-800 flex items-center gap-3">
                            <Clock className="w-5 h-5" />
                            <div>
                                <p className="font-medium">Öğretmen Onayı Bekleniyor</p>
                                <p className="text-xs opacity-90">{new Date(hw.submitted_at).toLocaleString('tr-TR')} tarihinde teslim ettiniz.</p>
                            </div>
                        </div>
                    )}

                    {hw.submission_status === 'approved' && (
                        <div className="bg-green-50 p-4 rounded-md border border-green-100 text-green-800 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5" />
                            <div>
                                <p className="font-medium">Tebrikler! Ödev Onaylandı.</p>
                            </div>
                        </div>
                    )}

                    {hw.submission_status === 'rejected' && (
                        <div className="bg-red-50 p-4 rounded-md border border-red-100 text-red-800 flex items-center gap-3">
                            <XCircle className="w-5 h-5" />
                            <div>
                                <p className="font-medium">Ödev Yapılmadı / Reddedildi</p>
                                {hw.teacher_feedback && <p className="text-sm mt-1">Not: {hw.teacher_feedback}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
