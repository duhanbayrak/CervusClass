'use client';

import { useState, useTransition, useCallback } from 'react';
import {
    Download,
    Search,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    FileSpreadsheet,
    Filter,
} from 'lucide-react';
import type { FinanceCategory, FinanceTransaction, TransactionType } from '@/types/accounting';
import { getFinanceTransactions } from '@/lib/actions/accounting';
import { format } from 'date-fns';
import { CategoryIcon } from '@/components/accounting/CategoryIcon';

// =============================================
// Props
// =============================================
interface ReportsContentProps {
    categories: FinanceCategory[];
}

// =============================================
// Yardımcı Fonksiyonlar
// =============================================

/** Para formatı */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/** Tarih formatı */
function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/** CSV'ye dönüştür ve indir */
function exportToCSV(transactions: FinanceTransaction[]) {
    const headers = ['Tarih', 'Tür', 'Kategori', 'Hesap', 'KDV Oranı (%)', 'KDV Tutarı', 'Tutar', 'Açıklama', 'Referans No'];
    const rows = transactions.map(tx => [
        tx.transaction_date,
        tx.type === 'income' ? 'Gelir' : 'Gider',
        tx.category?.name || '',
        tx.account?.name || '',
        tx.vat_rate ? `%${tx.vat_rate}` : '0',
        tx.vat_amount ? tx.vat_amount.toString() : '0',
        tx.amount.toString(),
        tx.description || '',
        tx.reference_no || '',
    ]);

    // BOM ile CSV oluştur (Türkçe karakter desteği)
    const csvContent = '\uFEFF' + [headers, ...rows].map(row =>
        row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(';')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapor_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

// =============================================
// Ana Bileşen
// =============================================
export default function ReportsContent({ categories }: ReportsContentProps) { // NOSONAR
    const [isPending, startTransition] = useTransition();

    // Filtre state
    const [type, setType] = useState<TransactionType | ''>('');
    const [categoryId, setCategoryId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Sonuç state
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);

    // Input class
    const inputClass = 'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors';
    const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';

    // Filtreli kategori listesi
    const filteredCategories = type
        ? categories.filter(c => c.type === type)
        : categories;

    // Ara
    const handleSearch = useCallback(() => {
        startTransition(async () => {
            const result = await getFinanceTransactions({
                type: type || undefined,
                category_id: categoryId || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                limit: 200,
            });
            setTransactions(result.data);
            setTotalCount(result.count);
            setHasSearched(true);
        });
    }, [type, categoryId, startDate, endDate]);

    // Özet hesapla
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalIncome - totalExpense;

    return (
        <div className="space-y-6">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Raporlama
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gelir ve gider işlemlerini filtreleyin, inceleyin ve dışa aktarın
                    </p>
                </div>

                {/* CSV İndir */}
                {transactions.length > 0 && (
                    <button
                        onClick={() => exportToCSV(transactions)}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-medium shadow-sm transition-colors cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">CSV İndir</span>
                    </button>
                )}
            </div>

            {/* ==================== FİLTRELER ==================== */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtreler</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Tür */}
                    <div>
                        <label htmlFor="reportType" className={labelClass}>İşlem Türü</label>
                        <select
                            id="reportType"
                            value={type}
                            onChange={e => {
                                setType(e.target.value as TransactionType | '');
                                setCategoryId('');
                            }}
                            className={inputClass}
                        >
                            <option value="">Tümü</option>
                            <option value="income">Gelir</option>
                            <option value="expense">Gider</option>
                        </select>
                    </div>

                    {/* Kategori */}
                    <div>
                        <label htmlFor="reportCategory" className={labelClass}>Kategori</label>
                        <select
                            id="reportCategory"
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Tümü</option>
                            {filteredCategories.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.type === 'income' ? 'Gelir' : 'Gider'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Başlangıç tarihi */}
                    <div>
                        <label htmlFor="reportStartDate" className={labelClass}>Başlangıç</label>
                        <input
                            id="reportStartDate"
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Bitiş tarihi */}
                    <div>
                        <label htmlFor="reportEndDate" className={labelClass}>Bitiş</label>
                        <input
                            id="reportEndDate"
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Ara butonu */}
                    <div className="flex items-end">
                        <button
                            onClick={handleSearch}
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                            Rapor Oluştur
                        </button>
                    </div>
                </div>
            </div>

            {/* ==================== ÖZET SATIRI ==================== */}
            {hasSearched && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Kayıt Sayısı</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                            {totalCount}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Toplam Gelir</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {formatCurrency(totalIncome)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Toplam Gider</p>
                        <p className="text-xl font-bold text-red-500 dark:text-red-400 mt-1">
                            {formatCurrency(totalExpense)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Net</p>
                        <p className={`text-xl font-bold mt-1 ${netAmount >= 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-500 dark:text-red-400'
                            }`}>
                            {formatCurrency(netAmount)}
                        </p>
                    </div>
                </div>
            )}

            {/* ==================== SONUÇ TABLOSU ==================== */}
            {hasSearched && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <FileSpreadsheet className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm">Filtreye uygun işlem bulunamadı</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-white/5">
                                        <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">Tarih</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">Tür</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">Kategori</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">Hesap</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">Açıklama</th>
                                        <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">Vergi (KDV)</th>
                                        <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">Tutar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[2%] transition-colors">
                                            <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                {formatDate(tx.transaction_date)}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${tx.type === 'income'
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                    : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                                    }`}>
                                                    {tx.type === 'income'
                                                        ? <><ArrowUpRight className="w-3 h-3" /> Gelir</>
                                                        : <><ArrowDownRight className="w-3 h-3" /> Gider</>
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                <CategoryIcon iconName={tx.category?.icon} />
                                                {tx.category?.name || '-'}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                {tx.account?.name || '-'}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                {tx.description || '-'}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">
                                                {tx.vat_rate ? `%${tx.vat_rate} (${formatCurrency(tx.vat_amount || 0)})` : '-'}
                                            </td>
                                            <td className={`px-5 py-3 text-sm font-semibold text-right whitespace-nowrap ${tx.type === 'income'
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-500 dark:text-red-400'
                                                }`}>
                                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* İlk açılış mesajı */}
            {!hasSearched && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <FileSpreadsheet className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                        Rapor oluşturmak için filtreleri kullanın
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Sonuçları CSV olarak dışa aktarabilirsiniz
                    </p>
                </div>
            )}
        </div>
    );
}
