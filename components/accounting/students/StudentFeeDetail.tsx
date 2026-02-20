'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Calendar, CreditCard, CheckCircle2, Clock,
    AlertTriangle, XCircle, Loader2, Receipt,
} from 'lucide-react';
import type { StudentFee, FeeInstallment, FeePayment } from '@/types/accounting';
import { cancelStudentFee } from '@/lib/actions/student-fees';
import { PaymentRecordDialog } from './PaymentRecordDialog';

interface StudentFeeDetailProps {
    fee: StudentFee | null;
    installments: FeeInstallment[];
    payments: FeePayment[];
    currency: string;
}

/** Para formatı */
function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

/** Tarih formatı */
function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

/** Taksit durumu stili */
function getInstallmentStatusStyle(status: string) {
    switch (status) {
        case 'paid':
            return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', label: 'Ödendi', icon: CheckCircle2 };
        case 'partial':
            return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', label: 'Kısmi Ödeme', icon: Clock };
        case 'overdue':
            return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', label: 'Vadesi Geçti', icon: AlertTriangle };
        default:
            return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', label: 'Bekliyor', icon: Clock };
    }
}

export function StudentFeeDetail({ fee, installments, payments, currency }: StudentFeeDetailProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);

    if (!fee) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 dark:text-gray-400">Ücret kaydı bulunamadı.</p>
                <button
                    onClick={() => router.push('/admin/accounting/students')}
                    className="mt-4 text-sm text-blue-600 hover:underline cursor-pointer"
                >
                    ← Listeye dön
                </button>
            </div>
        );
    }

    const feeWithStudent = fee as StudentFee & {
        student?: { full_name?: string; email?: string };
        classes?: { name?: string };
    };

    // Toplam ödenen
    const totalPaid = installments.reduce((sum, i) => sum + Number(i.paid_amount), 0);
    const remaining = Number(fee.net_amount) - totalPaid;
    const progressPercent = Number(fee.net_amount) > 0 ? Math.min((totalPaid / Number(fee.net_amount)) * 100, 100) : 0;

    // Ücret iptal
    const handleCancel = () => {
        if (!confirm('Bu ücreti iptal etmek istediğinize emin misiniz?')) return;
        startTransition(async () => {
            await cancelStudentFee(fee.id);
            router.refresh();
        });
    };

    // Ödeme kaydet
    const handlePayment = (installmentId: string) => {
        setSelectedInstallmentId(installmentId);
        setShowPaymentDialog(true);
    };

    const cardClass = 'rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6';

    return (
        <div className="space-y-6">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/accounting/students')}
                        className="rounded-lg border border-gray-200 dark:border-white/10 p-2 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {feeWithStudent.student?.full_name || 'Öğrenci'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {feeWithStudent.classes?.name && `${feeWithStudent.classes.name} • `}
                            {fee.academic_period}
                        </p>
                    </div>
                </div>
                {fee.status === 'active' && (
                    <button
                        onClick={handleCancel}
                        disabled={isPending}
                        className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        İptal Et
                    </button>
                )}
            </div>

            {/* Ücret Özeti */}
            <div className={cardClass}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Brüt Tutar</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(Number(fee.total_amount), currency)}
                        </p>
                    </div>
                    {Number(fee.discount_amount) > 0 && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">İndirim</p>
                            <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                                -{formatCurrency(Number(fee.discount_amount), currency)}
                            </p>
                            {fee.discount_reason && (
                                <p className="text-xs text-gray-400 mt-0.5">{fee.discount_reason}</p>
                            )}
                        </div>
                    )}
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net Tutar</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(Number(fee.net_amount), currency)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Kalan</p>
                        <p className={`text-lg font-bold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {formatCurrency(remaining, currency)}
                        </p>
                    </div>
                </div>

                {/* İlerleme çubuğu */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                        <span>Ödeme İlerlemesi</span>
                        <span>%{Math.round(progressPercent)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Taksit Planı */}
            <div className={cardClass}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Taksit Planı
                </h3>
                <div className="space-y-2">
                    {installments.map(installment => {
                        const statusStyle = getInstallmentStatusStyle(installment.status);
                        const StatusIcon = statusStyle.icon;
                        const remainingAmount = Number(installment.amount) - Number(installment.paid_amount);

                        return (
                            <div
                                key={installment.id}
                                className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] px-4 py-3"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white w-20">
                                        {installment.installment_number}. Taksit
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(installment.due_date)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(Number(installment.amount), currency)}
                                        </p>
                                        {Number(installment.paid_amount) > 0 && installment.status !== 'paid' && (
                                            <p className="text-xs text-gray-400">
                                                Ödenen: {formatCurrency(Number(installment.paid_amount), currency)}
                                            </p>
                                        )}
                                    </div>

                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusStyle.label}
                                    </span>

                                    {installment.status !== 'paid' && fee.status === 'active' && (
                                        <button
                                            onClick={() => handlePayment(installment.id)}
                                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                        >
                                            Ödeme Al ({formatCurrency(remainingAmount, currency)})
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {installments.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-4">
                            Taksit planı bulunamadı.
                        </p>
                    )}
                </div>
            </div>

            {/* Ödeme Geçmişi */}
            <div className={cardClass}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-green-500" />
                    Ödeme Geçmişi
                </h3>
                {payments.length > 0 ? (
                    <div className="space-y-2">
                        {payments.map(payment => {
                            const paymentWithRel = payment as FeePayment & {
                                account?: { name: string };
                                created_by_profile?: { full_name: string };
                            };

                            return (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="w-4 h-4 text-green-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(Number(payment.amount), currency)}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDate(payment.payment_date)} • {paymentWithRel.account?.name || '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                                            {payment.payment_method === 'cash' ? 'Nakit' :
                                                payment.payment_method === 'bank_transfer' ? 'Havale' :
                                                    payment.payment_method === 'credit_card' ? 'Kredi Kartı' : 'Diğer'}
                                        </span>
                                        {payment.reference_no && (
                                            <p className="text-xs text-gray-400 mt-0.5">Ref: {payment.reference_no}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-sm text-gray-400 py-4">
                        Henüz ödeme kaydı yok.
                    </p>
                )}
            </div>

            {/* Ödeme kayıt dialog */}
            {showPaymentDialog && (
                <PaymentRecordDialog
                    studentId={fee.student_id}
                    installmentId={selectedInstallmentId}
                    currency={currency}
                    onClose={() => {
                        setShowPaymentDialog(false);
                        setSelectedInstallmentId(null);
                    }}
                />
            )}
        </div>
    );
}
