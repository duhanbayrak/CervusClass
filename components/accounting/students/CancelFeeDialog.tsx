'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, AlertTriangle, Undo2 } from 'lucide-react';
import type { StudentFee, FeeInstallment } from '@/types/accounting';
import { cancelStudentFee } from '@/lib/actions/student-fees';

interface FinanceAccountOption {
    id: string;
    name: string;
}

interface CancelFeeDialogProps {
    fee: StudentFee;
    installments: FeeInstallment[];
    currency: string;
    onClose: () => void;
}

/** Para formatı */
function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export function CancelFeeDialog({ fee, installments, currency, onClose }: CancelFeeDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState('');

    // İade seçenekleri
    const [refund, setRefund] = useState(false);
    const [refundAccountId, setRefundAccountId] = useState('');
    const [reason, setReason] = useState('');
    const [accounts, setAccounts] = useState<FinanceAccountOption[]>([]);

    // Taksit istatistikleri
    const totalPaid = installments.reduce((sum, i) => sum + Number(i.paid_amount), 0);
    const paidCount = installments.filter(i => i.status === 'paid').length;
    const pendingCount = installments.filter(i => i.status === 'pending' || i.status === 'partial').length;

    // Hesap listesini yükle (iade seçildiğinde)
    useEffect(() => {
        if (!refund) return;
        async function loadAccounts() {
            try {
                const res = await fetch('/api/admin/accounting/lookup');
                if (res.ok) {
                    const data = await res.json();
                    setAccounts(data.accounts || []);
                }
            } catch {
                // Hata olursa boş bırak
            }
        }
        loadAccounts();
    }, [refund]);

    // İptal işlemi
    const handleConfirm = () => {
        startTransition(async () => {
            const result = await cancelStudentFee(fee.id, {
                refund,
                refundAccountId: refund ? refundAccountId : undefined,
                reason: reason || undefined,
            });

            if (result.success) {
                router.refresh();
                onClose();
            } else {
                setMessage(`Hata: ${result.error}`);
            }
        });
    };

    const inputClass = 'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
                {/* Başlık */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ücreti İptal Et</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Ücret özeti */}
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 space-y-2">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                            Bu işlem geri alınamaz!
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Net Tutar:</span>
                                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(Number(fee.net_amount), currency)}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Ödenen:</span>
                                <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                                    {formatCurrency(totalPaid, currency)}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Ödenen Taksit:</span>
                                <span className="ml-1 font-medium text-gray-900 dark:text-white">{paidCount}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Bekleyen Taksit:</span>
                                <span className="ml-1 font-medium text-gray-900 dark:text-white">{pendingCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* İade seçeneği (ödeme varsa göster) */}
                    {totalPaid > 0 && (
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={refund}
                                    onChange={e => setRefund(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <Undo2 className="w-4 h-4 text-blue-500" />
                                        İade Yap
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                        Ödenen {formatCurrency(totalPaid, currency)} tutarı kasadan düşülecek
                                    </span>
                                </div>
                            </label>

                            {/* İade hesabı seçimi */}
                            {refund && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        İade Hesabı
                                    </label>
                                    <select
                                        value={refundAccountId}
                                        onChange={e => setRefundAccountId(e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Orijinal hesaptan iade</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Boş bırakırsanız ilk ödemenin yapıldığı hesaptan düşülür.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* İptal sebebi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            İptal Sebebi (opsiyonel)
                        </label>
                        <input
                            type="text"
                            placeholder="Örn: Hatalı kayıt, öğrenci ayrıldı..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Hata mesajı */}
                    {message && (
                        <p className="text-sm text-red-500">{message}</p>
                    )}
                </div>

                {/* Eylem butonları */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        {isPending ? 'İptal ediliyor...' : 'Ücreti İptal Et'}
                    </button>
                </div>
            </div>
        </div>
    );
}
