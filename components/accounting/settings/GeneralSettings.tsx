'use client';

import { useState, useTransition } from 'react';
import { Save, Loader2 } from 'lucide-react';
import type { FinanceSettings, AcademicPeriod } from '@/types/accounting';
import { updateFinanceSettings } from '@/lib/actions/finance-settings';

interface GeneralSettingsProps {
    settings: FinanceSettings | null;
    onSave: () => void;
}

export function GeneralSettings({ settings, onSave }: GeneralSettingsProps) {
    const [isPending, startTransition] = useTransition();
    const [currency, setCurrency] = useState(settings?.currency || 'TRY');
    const [defaultInstallments, setDefaultInstallments] = useState(settings?.default_installments || 1);
    const [paymentDueDay, setPaymentDueDay] = useState(settings?.payment_due_day || 1);
    const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>(
        settings?.academic_periods || []
    );
    const [newPeriodName, setNewPeriodName] = useState('');
    const [newPeriodStart, setNewPeriodStart] = useState('');
    const [newPeriodEnd, setNewPeriodEnd] = useState('');
    const [saveMessage, setSaveMessage] = useState('');

    // Ayarları kaydet
    const handleSave = () => {
        startTransition(async () => {
            const result = await updateFinanceSettings({
                currency,
                default_installments: defaultInstallments,
                payment_due_day: paymentDueDay,
                academic_periods: academicPeriods,
            });

            if (result.success) {
                setSaveMessage('Ayarlar başarıyla kaydedildi.');
                onSave();
            } else {
                setSaveMessage(`Hata: ${result.error}`);
            }

            // 3 saniye sonra mesajı temizle
            setTimeout(() => setSaveMessage(''), 3000);
        });
    };

    // Yeni akademik dönem ekle
    const addPeriod = () => {
        if (!newPeriodName || !newPeriodStart || !newPeriodEnd) return;
        setAcademicPeriods(prev => [
            ...prev,
            {
                name: newPeriodName,
                start_date: newPeriodStart,
                end_date: newPeriodEnd,
                is_active: prev.length === 0, // İlk dönem aktif olsun
            },
        ]);
        setNewPeriodName('');
        setNewPeriodStart('');
        setNewPeriodEnd('');
    };

    // Dönemi sil
    const removePeriod = (index: number) => {
        setAcademicPeriods(prev => prev.filter((_, i) => i !== index));
    };

    // Aktif dönemi değiştir
    const toggleActivePeriod = (index: number) => {
        setAcademicPeriods(prev =>
            prev.map((p, i) => ({ ...p, is_active: i === index }))
        );
    };

    // Ortak input sınıfları
    const inputClass = 'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors';
    const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';
    const cardClass = 'rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6';

    return (
        <div className="space-y-6">
            {/* Para Birimi & Taksit Ayarları */}
            <div className={cardClass}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Ödeme Ayarları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Para Birimi */}
                    <div>
                        <label htmlFor="currency" className={labelClass}>Para Birimi</label>
                        <select
                            id="currency"
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                            className={inputClass}
                        >
                            <option value="TRY">₺ Türk Lirası (TRY)</option>
                            <option value="USD">$ Amerikan Doları (USD)</option>
                            <option value="EUR">€ Euro (EUR)</option>
                        </select>
                    </div>

                    {/* Varsayılan Taksit Sayısı */}
                    <div>
                        <label htmlFor="defaultInstallments" className={labelClass}>
                            Varsayılan Taksit Sayısı
                        </label>
                        <select
                            id="defaultInstallments"
                            value={defaultInstallments}
                            onChange={e => setDefaultInstallments(Number(e.target.value))}
                            className={inputClass}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                <option key={n} value={n}>
                                    {n === 1 ? 'Peşin' : `${n} Taksit`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Ödeme Vade Günü */}
                    <div>
                        <label htmlFor="paymentDueDay" className={labelClass}>
                            Aylık Vade Günü
                        </label>
                        <select
                            id="paymentDueDay"
                            value={paymentDueDay}
                            onChange={e => setPaymentDueDay(Number(e.target.value))}
                            className={inputClass}
                        >
                            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                <option key={d} value={d}>
                                    Her ayın {d}. günü
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Akademik Dönemler */}
            <div className={cardClass}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Akademik Dönemler
                </h3>

                {/* Mevcut dönemler */}
                {academicPeriods.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {academicPeriods.map((period, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] px-4 py-3"
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleActivePeriod(index)}
                                        className={`
                                            w-3 h-3 rounded-full transition-colors cursor-pointer
                                            ${period.is_active
                                                ? 'bg-green-500 ring-2 ring-green-200 dark:ring-green-800'
                                                : 'bg-gray-300 dark:bg-gray-600'
                                            }
                                        `}
                                        title={period.is_active ? 'Aktif dönem' : 'Aktif yap'}
                                    />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {period.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {period.start_date} — {period.end_date}
                                    </span>
                                    {period.is_active && (
                                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                                            Aktif
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => removePeriod(index)}
                                    className="text-red-500 hover:text-red-700 text-sm cursor-pointer"
                                >
                                    Kaldır
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Yeni dönem ekleme */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                        <label htmlFor="newPeriodName" className={labelClass}>Dönem Adı</label>
                        <input
                            id="newPeriodName"
                            type="text"
                            placeholder="örn: 2025-2026"
                            value={newPeriodName}
                            onChange={e => setNewPeriodName(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="newPeriodStart" className={labelClass}>Başlangıç</label>
                        <input
                            id="newPeriodStart"
                            type="date"
                            value={newPeriodStart}
                            onChange={e => setNewPeriodStart(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="newPeriodEnd" className={labelClass}>Bitiş</label>
                        <input
                            id="newPeriodEnd"
                            type="date"
                            value={newPeriodEnd}
                            onChange={e => setNewPeriodEnd(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <button
                        onClick={addPeriod}
                        disabled={!newPeriodName || !newPeriodStart || !newPeriodEnd}
                        className="rounded-lg bg-gray-100 dark:bg-white/10 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        Dönem Ekle
                    </button>
                </div>
            </div>

            {/* Kaydet butonu */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {isPending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </button>
                {saveMessage && (
                    <span className={`text-sm ${saveMessage.startsWith('Hata') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                        {saveMessage}
                    </span>
                )}
            </div>
        </div>
    );
}
