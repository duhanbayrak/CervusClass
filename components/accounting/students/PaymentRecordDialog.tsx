'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { createFeePayment } from '@/lib/actions/fee-payments';
import type { PaymentMethod } from '@/types/accounting';
import { format } from 'date-fns';
import { ReceiptDownloadButton } from '@/components/accounting/receipt/ReceiptDownloadButton';

interface PaymentRecordDialogProps {
    studentId: string;
    installmentId: string | null;
    currency: string;
    defaultAmount?: number;
    onClose: () => void;
}

interface AccountOption {
    id: string;
    name: string;
    account_type: string;
}

export function PaymentRecordDialog({ // NOSONAR
    studentId,
    installmentId,
    currency,
    defaultAmount,
    onClose,
}: Readonly<PaymentRecordDialogProps>) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState('');
    // Başarılı tahsilat sonrası makbuz indirmek için paymentId tutar
    const [successPaymentId, setSuccessPaymentId] = useState<string | null>(null);

    // Form state
    const [accountId, setAccountId] = useState('');
    const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toString() : '');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [referenceNo, setReferenceNo] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Hesap listesi
    const [accounts, setAccounts] = useState<AccountOption[]>([]);

    useEffect(() => {
        async function loadAccounts() {
            try {
                const res = await fetch('/api/admin/accounting/accounts');
                if (res.ok) {
                    const data = await res.json();
                    setAccounts(data.accounts || []);
                    if (data.accounts?.length > 0) {
                        setAccountId(data.accounts[0].id);
                    }
                }
            } catch {
                // Endpoint henüz yoksa boş bırak
            }
        }
        loadAccounts();
    }, []);

    // Ödemeyi kaydet
    const handleSubmit = () => {
        if (!accountId || !amount) {
            setMessage('Hata: Hesap ve tutar zorunludur.');
            return;
        }

        const numAmount = Number.parseFloat(amount);

        if (defaultAmount !== undefined && numAmount > defaultAmount) {
            setMessage(`Hata: Tahsilat tutarı aşımı! Bu taksit için en fazla ${defaultAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency} ödeme alınabilir.`);
            return;
        }

        startTransition(async () => {
            const result = await createFeePayment({
                student_id: studentId,
                installment_id: installmentId || undefined,
                account_id: accountId,
                amount: numAmount,
                payment_method: paymentMethod,
                reference_no: referenceNo || undefined,
                notes: notes || undefined,
                payment_date: paymentDate,
            });

            if (result.success) {
                router.refresh();
                // Başarılıysa makbuz indirme ekranını göster
                if (result.paymentId) {
                    setSuccessPaymentId(result.paymentId);
                } else {
                    onClose();
                }
            } else {
                setMessage(`Hata: ${result.error}`);
            }
        });
    };

    const inputClass = 'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors';
    const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10">
                {/* Başlık */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {successPaymentId ? 'Ödeme Kaydedildi' : 'Ödeme Kaydet'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ✅ Başarı Ekranı: Makbuz İndir */}
                {successPaymentId ? (
                    <>
                        <div className="p-6 space-y-4 text-center">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                            <p className="text-base font-medium text-gray-900 dark:text-white">
                                Tahsilat başarıyla kaydedildi!
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Makbuzu şimdi indirebilirsiniz.
                            </p>
                            <ReceiptDownloadButton paymentId={successPaymentId} variant="full" />
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
                            <button
                                onClick={onClose}
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                Kapat
                            </button>
                        </div>
                    </>
                ) : (
                    // Form Ekranı
                    <>
                        <div className="p-6 space-y-4">
                            {/* Hesap seçimi */}
                            <div>
                                <label htmlFor="paymentAccount" className={labelClass}>Kasa / Hesap *</label>
                                <select
                                    id="paymentAccount"
                                    value={accountId}
                                    onChange={e => setAccountId(e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Hesap seçin...</option>
                                    {accounts.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} ({a.account_type === 'cash' && 'Nakit'}{a.account_type === 'bank' && 'Banka'}{a.account_type !== 'cash' && a.account_type !== 'bank' && 'POS'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tutar */}
                            <div>
                                <label htmlFor="paymentAmount" className={labelClass}>Tutar *</label>
                                <div className="relative">
                                    <input
                                        id="paymentAmount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className={`${inputClass} pr-12`}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                                        {currency}
                                    </span>
                                </div>
                            </div>

                            {/* Ödeme yöntemi */}
                            <div>
                                <label htmlFor="paymentMethodSelect" className={labelClass}>Ödeme Yöntemi</label>
                                <select
                                    id="paymentMethodSelect"
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                                    className={inputClass}
                                >
                                    <option value="cash">Nakit</option>
                                    <option value="bank_transfer">Havale / EFT</option>
                                    <option value="credit_card">Kredi Kartı</option>
                                    <option value="other">Diğer</option>
                                </select>
                            </div>

                            {/* Tarih */}
                            <div>
                                <label htmlFor="paymentDateInput" className={labelClass}>Ödeme Tarihi</label>
                                <input
                                    id="paymentDateInput"
                                    type="date"
                                    value={paymentDate}
                                    onChange={e => setPaymentDate(e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            {/* Referans no */}
                            <div>
                                <label htmlFor="paymentRef" className={labelClass}>Referans No (opsiyonel)</label>
                                <input
                                    id="paymentRef"
                                    type="text"
                                    placeholder="Dekont/fiş numarası"
                                    value={referenceNo}
                                    onChange={e => setReferenceNo(e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            {/* Not */}
                            <div>
                                <label htmlFor="paymentNotes" className={labelClass}>Not (opsiyonel)</label>
                                <textarea
                                    id="paymentNotes"
                                    placeholder="Ödemeyle ilgili notlar..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={2}
                                    className={inputClass}
                                />
                            </div>

                            {/* Hata mesajı */}
                            {message && (
                                <p className={`text-sm ${message.startsWith('Hata') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                    {message}
                                </p>
                            )}
                        </div>

                        {/* Butonlar */}
                        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isPending || !accountId || !amount}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {isPending ? 'Kaydediliyor...' : 'Ödeme Kaydet'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
