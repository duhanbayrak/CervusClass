'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import type { FinanceCategory, FinanceAccount } from '@/types/accounting';
import { createFinanceTransaction } from '@/lib/actions/accounting';
import { format } from 'date-fns';

/** Türkiye KDV oranları */
const VAT_RATES = [
    { value: 0, label: '%0 (KDV Yok)' },
    { value: 1, label: '%1' },
    { value: 10, label: '%10' },
    { value: 20, label: '%20 (Genel)' },
];

interface ServiceOption {
    id: string;
    name: string;
    type: string;
    unit_price: number;
    vat_rate: number;
    category_id: string | null;
}

interface TransactionFormDialogProps {
    type: 'income' | 'expense';
    categories: FinanceCategory[];
    accounts: FinanceAccount[];
    onClose: () => void;
}

/** Para formatı */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
    }).format(amount);
}

export function TransactionFormDialog({ // NOSONAR
    type,
    categories,
    accounts,
    onClose,
}: Readonly<TransactionFormDialogProps>) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState('');

    // Hizmet listesi
    const [services, setServices] = useState<ServiceOption[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');

    // Form state
    const [accountId, setAccountId] = useState(accounts[0]?.id || '');
    const [categoryId, setCategoryId] = useState('');
    const [subtotal, setSubtotal] = useState('');
    const [vatRate, setVatRate] = useState('0');
    const [description, setDescription] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    const [transactionDate, setTransactionDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Hizmet listesini yükle
    useEffect(() => {
        async function loadServices() {
            try {
                const res = await fetch('/api/admin/accounting/lookup');
                if (res.ok) {
                    const data = await res.json();
                    // Sadece bu işlem tipine uygun hizmetleri filtrele
                    const filtered = (data.services || []).filter(
                        (s: ServiceOption) => s.type === type
                    );
                    setServices(filtered);
                }
            } catch {
                // Hata olursa boş
            }
        }
        loadServices();
    }, [type]);

    // Hizmet seçildiğinde form alanlarını doldur
    const handleServiceSelect = (serviceId: string) => {
        setSelectedServiceId(serviceId);
        if (!serviceId) return;

        const service = services.find(s => s.id === serviceId);
        if (service) {
            setSubtotal(service.unit_price.toString());
            setVatRate(service.vat_rate.toString());
            if (service.category_id) setCategoryId(service.category_id);
        }
    };

    // KDV hesaplama
    const price = Number.parseFloat(subtotal) || 0;
    const vat = Number.parseFloat(vatRate) || 0;
    const vatAmount = price * (vat / 100);
    const totalAmount = price + vatAmount;

    // Kaydet
    const handleSubmit = () => {
        if (!accountId || !categoryId || price <= 0) {
            setMessage('Hata: Hesap, kategori ve tutar zorunludur.');
            return;
        }

        startTransition(async () => {
            const result = await createFinanceTransaction({
                account_id: accountId,
                category_id: categoryId,
                amount: totalAmount,
                subtotal: price,
                vat_rate: vat,
                vat_amount: vatAmount,
                service_id: selectedServiceId || undefined,
                type,
                transaction_date: transactionDate,
                description: description || '',
                reference_no: referenceNo || undefined,
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
    const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';
    const submitLabel = type === 'income' ? 'Gelir Kaydet' : 'Gider Kaydet';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
                {/* Başlık */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {type === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Hizmet seçimi */}
                    {services.length > 0 && (
                        <div>
                            <label htmlFor="txService" className={labelClass}>Hizmet / Ürün</label>
                            <select
                                id="txService"
                                value={selectedServiceId}
                                onChange={e => handleServiceSelect(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Manuel giriş...</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({formatCurrency(s.unit_price)} + %{s.vat_rate} KDV)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Hesap */}
                    <div>
                        <label htmlFor="txAccount" className={labelClass}>Kasa / Hesap *</label>
                        <select
                            id="txAccount"
                            value={accountId}
                            onChange={e => setAccountId(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Hesap seçin...</option>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Kategori */}
                    <div>
                        <label htmlFor="txCategory" className={labelClass}>Kategori *</label>
                        <select
                            id="txCategory"
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Kategori seçin...</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tutar (KDV hariç) + KDV oranı */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="txSubtotal" className={labelClass}>Tutar (KDV Hariç) *</label>
                            <div className="relative">
                                <input
                                    id="txSubtotal"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={subtotal}
                                    onChange={e => setSubtotal(e.target.value)}
                                    className={`${inputClass} pr-12`}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">TRY</span>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="txVat" className={labelClass}>KDV Oranı</label>
                            <select
                                id="txVat"
                                value={vatRate}
                                onChange={e => setVatRate(e.target.value)}
                                className={inputClass}
                            >
                                {VAT_RATES.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* KDV hesaplama özeti */}
                    {price > 0 && (
                        <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-3 space-y-1">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>KDV Hariç</span>
                                <span>{formatCurrency(price)}</span>
                            </div>
                            {vat > 0 && (
                                <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                                    <span>KDV (%{vat})</span>
                                    <span>+{formatCurrency(vatAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-white/10 pt-1">
                                <span>Toplam</span>
                                <span>{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                    )}

                    {/* Tarih */}
                    <div>
                        <label htmlFor="txDate" className={labelClass}>Tarih</label>
                        <input
                            id="txDate"
                            type="date"
                            value={transactionDate}
                            onChange={e => setTransactionDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Açıklama */}
                    <div>
                        <label htmlFor="txDesc" className={labelClass}>Açıklama</label>
                        <input
                            id="txDesc"
                            type="text"
                            placeholder={type === 'income' ? 'Gelir açıklaması...' : 'Gider açıklaması...'}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Referans */}
                    <div>
                        <label htmlFor="txRef" className={labelClass}>Referans / Fiş No</label>
                        <input
                            id="txRef"
                            type="text"
                            placeholder="Opsiyonel"
                            value={referenceNo}
                            onChange={e => setReferenceNo(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Mesaj */}
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
                        disabled={isPending}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 transition-colors cursor-pointer ${type === 'income'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isPending ? 'Kaydediliyor...' : submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
