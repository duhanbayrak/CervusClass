'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import type { CategoryType, FinanceService } from '@/types/accounting';
import { createFinanceService, updateFinanceService } from '@/lib/actions/finance-services';

interface CategoryOption {
    id: string;
    name: string;
}

interface ServiceFormDialogProps {
    service?: FinanceService | null;
    currency: string;
    onClose: () => void;
}

/** Türkiye'de geçerli KDV oranları */
const VAT_RATES = [
    { value: 0, label: '%0 (KDV Yok)' },
    { value: 1, label: '%1' },
    { value: 10, label: '%10' },
    { value: 20, label: '%20 (Genel)' },
];

/** Para formatı */
function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency || 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function ServiceFormDialog({ service, currency, onClose }: Readonly<ServiceFormDialogProps>) { // NOSONAR
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState('');

    // Form state
    const [name, setName] = useState(service?.name || '');
    const [type, setType] = useState<CategoryType>(service?.type || 'income');
    const [categoryId, setCategoryId] = useState(service?.category_id || '');
    const [unitPrice, setUnitPrice] = useState(service?.unit_price?.toString() || '');
    const [vatRate, setVatRate] = useState(service?.vat_rate?.toString() || '0');
    const [description, setDescription] = useState(service?.description || '');

    // Kategori listesi
    const [categories, setCategories] = useState<CategoryOption[]>([]);

    // Kategorileri yükle
    useEffect(() => {
        async function loadCategories() {
            try {
                const res = await fetch('/api/admin/accounting/lookup');
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data.categories || []);
                }
            } catch {
                // Hata olursa boş bırak
            }
        }
        loadCategories();
    }, []);

    // KDV hesaplama
    const price = Number.parseFloat(unitPrice) || 0;
    const vat = Number.parseFloat(vatRate) || 0;
    const vatAmount = price * (vat / 100);
    const totalWithVat = price + vatAmount;

    // Kaydet
    const handleSubmit = () => {
        if (!name.trim()) {
            setMessage('Hata: Hizmet adı zorunludur.');
            return;
        }
        if (price <= 0) {
            setMessage('Hata: Birim fiyat sıfırdan büyük olmalıdır.');
            return;
        }

        startTransition(async () => {
            if (service) {
                // Güncelle
                const result = await updateFinanceService(service.id, {
                    name: name.trim(),
                    type,
                    category_id: categoryId || null,
                    unit_price: price,
                    vat_rate: vat,
                    description: description.trim() || null,
                });
                if (result.success) {
                    router.refresh();
                    onClose();
                } else {
                    setMessage(`Hata: ${result.error}`);
                }
            } else {
                // Yeni oluştur
                const result = await createFinanceService({
                    name: name.trim(),
                    type,
                    category_id: categoryId || undefined,
                    unit_price: price,
                    vat_rate: vat,
                    description: description.trim() || undefined,
                });
                if (result.success) {
                    router.refresh();
                    onClose();
                } else {
                    setMessage(`Hata: ${result.error}`);
                }
            }
        });
    };

    const inputClass = 'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors';
    const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';
    const serviceActionLabel = service ? 'Güncelle' : 'Kaydet';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
                {/* Başlık */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {service ? 'Hizmeti Düzenle' : 'Yeni Hizmet / Ürün'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Ad */}
                    <div>
                        <label htmlFor="serviceName" className={labelClass}>Hizmet / Ürün Adı *</label>
                        <input
                            id="serviceName"
                            type="text"
                            placeholder="Örn: Matematik Kursu"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Tip + Kategori */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="serviceType" className={labelClass}>Tip *</label>
                            <select
                                id="serviceType"
                                value={type}
                                onChange={e => setType(e.target.value as CategoryType)}
                                className={inputClass}
                            >
                                <option value="income">Gelir</option>
                                <option value="expense">Gider</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="serviceCategory" className={labelClass}>Kategori</label>
                            <select
                                id="serviceCategory"
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
                    </div>

                    {/* Birim Fiyat + KDV */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="unitPrice" className={labelClass}>Birim Fiyat (KDV Hariç) *</label>
                            <div className="relative">
                                <input
                                    id="unitPrice"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={unitPrice}
                                    onChange={e => setUnitPrice(e.target.value)}
                                    className={`${inputClass} pr-12`}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                                    {currency}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="vatRate" className={labelClass}>KDV Oranı *</label>
                            <select
                                id="vatRate"
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
                        <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-4 space-y-1">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                <span>KDV Hariç</span>
                                <span>{formatCurrency(price, currency)}</span>
                            </div>
                            {vat > 0 && (
                                <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                                    <span>KDV (%{vat})</span>
                                    <span>+{formatCurrency(vatAmount, currency)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-white/10 pt-1">
                                <span>KDV Dahil Toplam</span>
                                <span>{formatCurrency(totalWithVat, currency)}</span>
                            </div>
                        </div>
                    )}

                    {/* Açıklama */}
                    <div>
                        <label htmlFor="serviceDesc" className={labelClass}>Açıklama (opsiyonel)</label>
                        <textarea
                            id="serviceDesc"
                            placeholder="Hizmet hakkında ek bilgi..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={2}
                            className={inputClass}
                        />
                    </div>

                    {/* Hata mesajı */}
                    {message && (
                        <p className={`text-sm ${message.startsWith('Hata') ? 'text-red-500' : 'text-green-600'}`}>
                            {message}
                        </p>
                    )}
                </div>

                {/* Eylem butonları */}
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
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isPending ? 'Kaydediliyor...' : serviceActionLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
