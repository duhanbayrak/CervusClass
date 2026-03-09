'use client';

import { useState, useTransition } from 'react';
import {
    Wallet,
    ChevronDown,
    ChevronUp,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Loader2,
} from 'lucide-react';
import type { StudentFee, FeeInstallment } from '@/types/accounting';
import {
    FEE_STATUS_LABELS,
    INSTALLMENT_STATUS_LABELS,
} from '@/types/accounting';
import { getMyInstallments } from '@/lib/actions/student-payments';

// =============================================
// Props
// =============================================
interface MyPaymentsContentProps {
    readonly fees: StudentFee[];
}

// =============================================
// Yardımcı Fonksiyonlar
// =============================================

/** Para formatı */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
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

/** Ücret durumuna göre badge rengi */
function feeStatusColor(status: string) {
    switch (status) {
        case 'active': return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
        case 'completed': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
        case 'cancelled': return 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400';
        default: return 'bg-gray-100 text-gray-500';
    }
}

/** Taksit durumuna göre metin rengi */
function installmentStatusColor(status: string): string {
    if (status === 'paid') return 'text-emerald-600 dark:text-emerald-400';
    if (status === 'overdue') return 'text-red-500 dark:text-red-400';
    if (status === 'partial') return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-500';
}

/** Taksit durumuna göre ikon */
function installmentIcon(status: string) {
    switch (status) {
        case 'paid': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-500" />;
        case 'partial': return <Clock className="w-4 h-4 text-amber-500" />;
        default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
}

/** Taksit durumuna göre satır rengi */
function installmentRowClass(status: string) {
    switch (status) {
        case 'paid': return 'bg-emerald-50/30 dark:bg-emerald-500/5';
        case 'overdue': return 'bg-red-50/30 dark:bg-red-500/5';
        case 'partial': return 'bg-amber-50/30 dark:bg-amber-500/5';
        default: return '';
    }
}

// =============================================
// Ana Bileşen
// =============================================
export default function MyPaymentsContent({ fees }: Readonly<MyPaymentsContentProps>) {
    // Toplam özet hesapla
    const totalNet = fees.filter(f => f.status !== 'cancelled').reduce((sum, f) => sum + f.net_amount, 0);

    return (
        <div className="space-y-6">
            {/* Başlık */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Ödeme Durumum
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Ücret kayıtlarınız ve taksit durumlarınız
                </p>
            </div>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Toplam Ücret</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(totalNet)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Tamamlanan</p>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {fees.filter(f => f.status === 'completed').length}
                                <span className="text-sm font-normal text-gray-400 ml-1">kayıt</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Devam Eden</p>
                            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                {fees.filter(f => f.status === 'active').length}
                                <span className="text-sm font-normal text-gray-400 ml-1">kayıt</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ücret Listesi */}
            {fees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Wallet className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                        Henüz ücret kaydınız bulunmuyor
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {fees.map(fee => (
                        <FeeCard key={fee.id} fee={fee} />
                    ))}
                </div>
            )}
        </div>
    );
}

// =============================================
// Alt Bileşen: Ücret Kartı (accordion)
// =============================================
function FeeCard({ fee }: Readonly<{ fee: StudentFee }>) {
    const [isOpen, setIsOpen] = useState(false);
    const [installments, setInstallments] = useState<FeeInstallment[]>([]);
    const [isLoading, startTransition] = useTransition();
    const [loaded, setLoaded] = useState(false);

    // Taksitleri yükle (ilk açılışta)
    const toggle = () => {
        if (!isOpen && !loaded) {
            startTransition(async () => {
                const data = await getMyInstallments(fee.id);
                setInstallments(data);
                setLoaded(true);
            });
        }
        setIsOpen(!isOpen);
    };

    // İlerleme hesapla
    const paidCount = installments.filter(i => i.status === 'paid').length;
    const progressPercent = installments.length > 0
        ? Math.round((paidCount / installments.length) * 100)
        : 0;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden transition-shadow hover:shadow-sm">
            {/* Header — tıklanabilir */}
            <button
                onClick={toggle}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/[2%] transition-colors"
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {fee.academic_period}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${feeStatusColor(fee.status)}`}>
                            {FEE_STATUS_LABELS[fee.status]}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {fee.classes?.name && <span>{fee.classes.name}</span>}
                        <span>·</span>
                        <span>{fee.installment_count} taksit</span>
                        {fee.discount_amount > 0 && (
                            <>
                                <span>·</span>
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    İndirim: {formatCurrency(fee.discount_amount)}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(fee.net_amount)}
                        </p>
                        <p className="text-xs text-gray-400">net tutar</p>
                    </div>
                    {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </button>

            {/* Taksit detayları (accordion) */}
            {isOpen && (
                <div className="border-t border-gray-100 dark:border-white/5">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                    )}
                    {!isLoading && installments.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-6">
                            Taksit bilgisi bulunamadı
                        </p>
                    )}
                    {!isLoading && installments.length > 0 && (
                        <>
                            {/* İlerleme çubuğu */}
                            <div className="px-5 pt-4 pb-2">
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                                    <span>Ödeme İlerlemesi</span>
                                    <span className="font-medium">{paidCount}/{installments.length} taksit ödendi (%{progressPercent})</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Taksit listesi */}
                            <div className="px-5 pb-4 space-y-2 mt-2">
                                {installments.map(inst => (
                                    <div
                                        key={inst.id}
                                        className={`flex items-center justify-between p-3 rounded-xl transition-colors ${installmentRowClass(inst.status)}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {installmentIcon(inst.status)}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {inst.installment_number}. Taksit
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Vade: {formatDate(inst.due_date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0 ml-3">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(inst.amount)}
                                            </p>
                                            <span className={`text-xs font-medium ${installmentStatusColor(inst.status)}`}>
                                                {INSTALLMENT_STATUS_LABELS[inst.status]}
                                                {inst.status === 'partial' && ` (${formatCurrency(inst.paid_amount)})`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

        </div>
    );
}
