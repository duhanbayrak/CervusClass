'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Calendar, CreditCard, CheckCircle2, Clock,
    AlertTriangle, XCircle, Receipt, Box, Plus
} from 'lucide-react';
import type { StudentFee, FeeInstallment, FeePayment } from '@/types/accounting';
import { CancelFeeDialog } from './CancelFeeDialog';
import { PaymentRecordDialog } from './PaymentRecordDialog';
import { FeeAssignmentDialog } from './FeeAssignmentDialog';
import { ReceiptDownloadButton } from '@/components/accounting/receipt/ReceiptDownloadButton';

interface StudentFeeDetailProps {
    fees: (StudentFee | null)[];
    installments: FeeInstallment[];
    payments: FeePayment[];
    currency: string;
    studentId: string;
}

/** Para formatı */
function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency || 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
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
        case 'cancelled':
            return { bg: 'bg-gray-100 dark:bg-gray-800/50', text: 'text-gray-500 dark:text-gray-400 line-through', label: 'İptal Edildi', icon: XCircle };
        default:
            return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', label: 'Bekliyor', icon: Clock };
    }
}

export function StudentFeeDetail({ fees, installments, payments, currency, studentId }: StudentFeeDetailProps) {
    const router = useRouter();
    const isPending = false;
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showFeeDialog, setShowFeeDialog] = useState(false);

    // İşlem yapılan fee ve taksidi tut
    const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null);
    const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);
    const [selectedInstallmentAmount, setSelectedInstallmentAmount] = useState<number | undefined>(undefined);

    // Sadece null olmayan geçerli ücretleri filtrele
    const validFees = fees.filter((f): f is StudentFee => f !== null);
    const activeFees = validFees.filter(f => f.status !== 'cancelled');
    const cancelledFees = validFees.filter(f => f.status === 'cancelled');

    // Aktif sekme state'i (önce activeFees hesaplansın)
    let defaultTab: string | null = null;
    if (activeFees.length > 0) defaultTab = activeFees[0].id;
    else if (cancelledFees.length > 0) defaultTab = 'cancelled_fees_tab';
    const [activeTab, setActiveTab] = useState<string | null>(defaultTab);

    if (validFees.length === 0) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 dark:text-gray-400">Öğrenciye ait ücret kaydı bulunamadı.</p>
                <button
                    onClick={() => router.push('/admin/accounting/students')}
                    className="mt-4 text-sm text-blue-600 hover:underline cursor-pointer"
                >
                    ← Listeye dön
                </button>
            </div>
        );
    }

    // İlk fee üzerinden öğrenci bilgilerini alalım (Hepsi aynı öğrenciye ait)
    const firstFee = validFees[0];
    const feeWithStudent = firstFee as StudentFee & {
        student?: { full_name?: string; email?: string };
        classes?: { name?: string };
    };

    // Modal işlemleri
    const handleCancel = (fee: StudentFee) => {
        setSelectedFee(fee);
        setShowCancelDialog(true);
    };

    const handlePayment = (installmentId: string, amount: number) => {
        setSelectedInstallmentId(installmentId);
        setSelectedInstallmentAmount(amount);
        setShowPaymentDialog(true);
    };

    const cardClass = 'rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6';

    return (
        <div className="space-y-8">
            {/* Ortak Başlık */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/accounting/students')}
                        className="rounded-lg border border-gray-200 dark:border-white/10 p-2 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {feeWithStudent.student?.full_name || 'Öğrenci'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {feeWithStudent.classes?.name && `${feeWithStudent.classes.name} sınıfı öğrencisi • `}
                            Toplam {activeFees.length} aktif sepet{cancelledFees.length > 0 ? `, ${cancelledFees.length} iptal edilen` : ''}
                        </p>
                    </div>
                </div>
                <div>
                    <button
                        onClick={() => setShowFeeDialog(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Hizmet Ekle
                    </button>
                </div>
            </div>

            {/* Bölüm Başlığı & Tab Geçişleri */}
            <div className="border-b border-gray-200 dark:border-gray-800 flex justify-between items-end">
                <div className="flex overflow-x-auto overflow-y-hidden gap-2 scrollbar-hide flex-1">
                    {activeFees.map(fee => {
                        const serviceDetails = fee as StudentFee & { service?: { name: string } };
                        const serviceName = serviceDetails.service?.name || `Hizmet/Ürün (${fee.academic_period})`;
                        const isActive = activeTab === fee.id;

                        return (
                            <button
                                key={fee.id}
                                onClick={() => setActiveTab(fee.id)}
                                className={`whitespace-nowrap px-5 py-3 font-medium text-sm transition-colors border-b-2 -mb-[1px] ${isActive
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                {serviceName}
                            </button>
                        );
                    })}
                </div>
                {cancelledFees.length > 0 && (
                    <button
                        onClick={() => setActiveTab('cancelled_fees_tab')}
                        className={`whitespace-nowrap px-5 py-3 font-medium text-sm transition-colors border-b-2 -mb-[1px] border-l border-l-gray-200 dark:border-l-gray-800 ${activeTab === 'cancelled_fees_tab'
                            ? 'border-b-red-500 text-red-600 dark:border-b-red-400 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10'
                            : 'border-b-transparent text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/5'
                            }`}
                    >
                        İptal Edilenler ({cancelledFees.length})
                    </button>
                )}
            </div>

            {/* Seçili Hizmet Sepeti ve Taksit Planı */}
            <div className="space-y-6 mt-6">
                {(activeTab === 'cancelled_fees_tab' ? cancelledFees : activeFees.filter(fee => fee.id === activeTab)).map(fee => {
                    const feeInstallments = installments.filter(i => i.fee_id === fee.id);
                    const totalPaid = feeInstallments.reduce((sum, i) => sum + Number(i.paid_amount), 0);
                    const remaining = Number(fee.net_amount) - totalPaid;
                    const progressPercent = Number(fee.net_amount) > 0 ? Math.min((totalPaid / Number(fee.net_amount)) * 100, 100) : 0;

                    const serviceDetails = fee as StudentFee & { service?: { name: string } };
                    const serviceName = serviceDetails.service?.name || `Hizmet/Ürün (${fee.academic_period})`;

                    return (
                        <div key={fee.id} className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#111111] overflow-hidden shadow-sm">
                            {/* Sepet Başlığı ve İptal Butonu */}
                            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.01]">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                        <Box className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{serviceName}</h3>
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {fee.status === 'active' && 'Durum: Aktif'}
                                                {fee.status === 'completed' && 'Durum: Tamamlandı'}
                                                {fee.status !== 'active' && fee.status !== 'completed' && 'Durum: İptal Edildi'}
                                            </p>
                                            {fee.status === 'cancelled' && fee.notes && (
                                                <p className="text-xs text-red-500 font-medium">
                                                    İptal Notu: {fee.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {fee.status === 'active' && (
                                    <button
                                        onClick={() => handleCancel(fee)}
                                        disabled={isPending}
                                        className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 border border-red-200 dark:border-red-800/50 rounded-lg px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer disabled:opacity-50 font-medium"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Sepeti İptal Et
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {/* Ücret Özeti (Sadece bu sepet için) */}
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Brüt Tutar</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(Number(fee.total_amount), currency)}
                                        </p>
                                    </div>
                                    {Number(fee.discount_amount) > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">İndirim</p>
                                            <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                                                -{fee.discount_type === 'percentage'
                                                    ? `%${fee.discount_amount}`
                                                    : formatCurrency(Number(fee.discount_amount), currency)
                                                }
                                            </p>
                                            {fee.discount_reason && (
                                                <p className="text-xs text-gray-400 mt-0.5 truncate" title={fee.discount_reason}>{fee.discount_reason}</p>
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Vergi (KDV)</p>
                                        <p className="text-base font-semibold text-gray-600 dark:text-gray-400">
                                            {formatCurrency(Number(fee.vat_amount || 0), currency)}
                                            <span className="text-xs font-normal ml-1">({fee.vat_rate ? `%${fee.vat_rate}` : 'Yok'})</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Net Tutar</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(Number(fee.net_amount), currency)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Kalan Ödeme</p>
                                        <p className={`text-lg font-bold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {formatCurrency(remaining, currency)}
                                        </p>
                                    </div>

                                    {/* Tek sepetin progress çubuğu tam genişliğe yayılır */}
                                    <div className="col-span-2 lg:col-span-5 mt-2">
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            <span className="font-medium">Tahsilat İlerlemesi</span>
                                            <span className="font-bold text-gray-700 dark:text-gray-300">%{(progressPercent || 0).toFixed(1)}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-700 ease-out"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sepetin taksit planı */}
                                <div>
                                    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        Taksit ve Ödeme Planı
                                    </h4>
                                    <div className="space-y-3">
                                        {feeInstallments.map(installment => {
                                            const statusStyle = getInstallmentStatusStyle(installment.status);
                                            const StatusIcon = statusStyle.icon;
                                            const remainingAmount = Number(installment.amount) - Number(installment.paid_amount);

                                            return (
                                                <div
                                                    key={installment.id}
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] p-4 hover:border-gray-200 dark:hover:border-gray-800 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold text-sm">
                                                            {installment.installment_number}
                                                        </div>
                                                        <div>
                                                            <span className="block text-sm font-medium text-gray-900 dark:text-white">
                                                                Taksit
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                Son Ödeme: <span className="text-gray-700 dark:text-gray-300 font-medium">{formatDate(installment.due_date)}</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t border-gray-100 dark:border-white/5 sm:border-0 pt-3 sm:pt-0">
                                                        <div className="text-left sm:text-right">
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white text-lg">
                                                                {formatCurrency(Number(installment.amount), currency)}
                                                            </p>
                                                            {Number(installment.paid_amount) > 0 && installment.status !== 'paid' && (
                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                    Ödenen: <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(Number(installment.paid_amount), currency)}</span>
                                                                </p>
                                                            )}
                                                        </div>

                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} whitespace-nowrap`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {statusStyle.label}
                                                        </span>

                                                        {installment.status !== 'paid' && fee.status === 'active' && (
                                                            <button
                                                                onClick={() => handlePayment(installment.id, remainingAmount)}
                                                                className="text-xs font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-all hover:shadow-md cursor-pointer whitespace-nowrap"
                                                            >
                                                                Tahsil Et ({formatCurrency(remainingAmount, currency)})
                                                            </button>
                                                        )}

                                                        {/* Ödendi taksitler için makbuz ikonu */}
                                                        {installment.status === 'paid' && (
                                                            <ReceiptDownloadButton
                                                                installmentId={installment.id}
                                                                variant="icon"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {feeInstallments.length === 0 && (
                                            <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Bu sepet için onaylı taksit planı bulunamadı.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Öğrencinin Olası Tüm Ödeme Geçmişi */}
            <div className={cardClass}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-green-500" />
                    Genel Tahsilat ve Ödeme Geçmişi
                </h3>
                {payments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {payments.map(payment => {
                            const paymentWithRel = payment as FeePayment & {
                                account?: { name: string };
                                created_by_profile?: { full_name: string };
                            };

                            return (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] p-5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="mt-0.5 bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                                            <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(Number(payment.amount), currency)}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(payment.payment_date)}</span>
                                                <span className="mx-1.5 opacity-50">•</span>
                                                Kasa: {paymentWithRel.account?.name || 'Belirtilmedi'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-2">
                                            {/* Makbuz indirme ikonu */}
                                            <ReceiptDownloadButton paymentId={payment.id} variant="icon" />
                                            <span className="text-[11px] uppercase tracking-wider font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-md">
                                                {payment.payment_method === 'cash' && 'Nakit'}
                                                {payment.payment_method === 'bank_transfer' && 'Havale'}
                                                {payment.payment_method === 'credit_card' && 'Kredi Kartı'}
                                                {payment.payment_method !== 'cash' && payment.payment_method !== 'bank_transfer' && payment.payment_method !== 'credit_card' && 'Diğer'}
                                            </span>
                                        </div>
                                        {payment.reference_no && (
                                            <span className="text-xs text-gray-400 overflow-hidden text-ellipsis max-w-[120px]" title={payment.reference_no}>
                                                Ref: {payment.reference_no}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                        <Receipt className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Öğrenciye ait herhangi bir tahsilat kaydı yok.</p>
                        <p className="text-xs text-gray-500 mt-1">Yapılan ödemeler tarih sırasına göre burada listelenecektir.</p>
                    </div>
                )}
            </div>

            {/* Ödeme kayıt dialog */}
            {showPaymentDialog && (
                <PaymentRecordDialog
                    studentId={studentId}
                    installmentId={selectedInstallmentId}
                    currency={currency}
                    defaultAmount={selectedInstallmentAmount}
                    onClose={() => {
                        setShowPaymentDialog(false);
                        setSelectedInstallmentId(null);
                        setSelectedInstallmentAmount(undefined);
                    }}
                />
            )}

            {/* Ücret iptal dialog */}
            {showCancelDialog && selectedFee && (
                <CancelFeeDialog
                    fee={selectedFee}
                    installments={installments.filter(i => i.fee_id === selectedFee.id)}
                    currency={currency}
                    onClose={() => {
                        setShowCancelDialog(false);
                        setSelectedFee(null);
                    }}
                />
            )}

            {showFeeDialog && (
                <FeeAssignmentDialog
                    currency={currency}
                    defaultStudentId={studentId}
                    onClose={() => setShowFeeDialog(false)}
                />
            )}
        </div>
    );
}
