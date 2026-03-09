'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, Search, Package, ToggleLeft, ToggleRight,
    Pencil, Trash2, Loader2, TrendingUp, TrendingDown,
} from 'lucide-react';
import type { FinanceService } from '@/types/accounting';
import { deleteFinanceService, updateFinanceService } from '@/lib/actions/finance-services';
import { ServiceFormDialog } from './ServiceFormDialog';

interface ServiceListProps {
    services: FinanceService[];
    currency: string;
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

export default function ServiceList({ services, currency }: Readonly<ServiceListProps>) { // NOSONAR
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState<FinanceService | null>(null);

    // Filtreleme
    const filtered = services.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'all' || s.type === typeFilter;
        return matchesSearch && matchesType;
    });

    // İstatistikler
    const activeCount = services.filter(s => s.is_active).length;
    const incomeCount = services.filter(s => s.type === 'income').length;
    const expenseCount = services.filter(s => s.type === 'expense').length;

    // Sil
    const handleDelete = (id: string, name: string) => {
        if (!confirm(`"${name}" hizmetini silmek istediğinize emin misiniz?`)) return;
        startTransition(async () => {
            const result = await deleteFinanceService(id);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error);
            }
        });
    };

    // Aktif/pasif değiştir
    const handleToggle = (id: string, currentActive: boolean) => {
        startTransition(async () => {
            await updateFinanceService(id, { is_active: !currentActive });
            router.refresh();
        });
    };

    const filterBtnClass = (active: boolean) =>
        `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${active
            ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
        }`;

    return (
        <div className="space-y-6">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hizmetler & Ürünler</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Kurumunuzun sunduğu hizmet ve ürünleri KDV oranlarıyla birlikte yönetin.
                    </p>
                </div>
                <button
                    onClick={() => { setEditingService(null); setShowForm(true); }}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Hizmet
                </button>
            </div>

            {/* Özet kartlar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Toplam</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{services.length}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aktif</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{activeCount}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gelir Hizmeti</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{incomeCount}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gider Hizmeti</p>
                    <p className="text-2xl font-bold text-red-500 dark:text-red-400 mt-1">{expenseCount}</p>
                </div>
            </div>

            {/* Filtreler */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Hizmet ara..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    />
                </div>
                <div className="flex gap-1.5 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
                    <button onClick={() => setTypeFilter('all')} className={filterBtnClass(typeFilter === 'all')}>Tümü</button>
                    <button onClick={() => setTypeFilter('income')} className={filterBtnClass(typeFilter === 'income')}>Gelir</button>
                    <button onClick={() => setTypeFilter('expense')} className={filterBtnClass(typeFilter === 'expense')}>Gider</button>
                </div>
            </div>

            {/* Tablo */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Hizmet bulunamadı</p>
                    <p className="text-sm mt-1">Yeni bir hizmet/ürün ekleyerek başlayın.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Hizmet</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Tip</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Kategori</th>
                                    <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Birim Fiyat</th>
                                    <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">KDV</th>
                                    <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">KDV Dahil</th>
                                    <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Durum</th>
                                    <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {filtered.map(s => {
                                    const vatAmount = s.unit_price * (s.vat_rate / 100);
                                    const total = s.unit_price + vatAmount;

                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.015] transition-colors">
                                            {/* Ad */}
                                            <td className="px-5 py-3.5">
                                                <div className="font-medium text-sm text-gray-900 dark:text-white">{s.name}</div>
                                                {s.description && (
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[200px]">{s.description}</div>
                                                )}
                                            </td>
                                            {/* Tip */}
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                    {s.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {s.type === 'income' ? 'Gelir' : 'Gider'}
                                                </span>
                                            </td>
                                            {/* Kategori */}
                                            <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                                                {s.category?.name || '—'}
                                            </td>
                                            {/* Birim fiyat */}
                                            <td className="px-5 py-3.5 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(s.unit_price, currency)}
                                            </td>
                                            {/* KDV */}
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${s.vat_rate > 0 ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}>
                                                    %{s.vat_rate}
                                                </span>
                                            </td>
                                            {/* KDV dahil */}
                                            <td className="px-5 py-3.5 text-sm text-right font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(total, currency)}
                                            </td>
                                            {/* Durum */}
                                            <td className="px-5 py-3.5 text-center">
                                                <button
                                                    onClick={() => handleToggle(s.id, s.is_active)}
                                                    className="cursor-pointer"
                                                    title={s.is_active ? 'Pasif yap' : 'Aktif yap'}
                                                >
                                                    {s.is_active
                                                        ? <ToggleRight className="w-6 h-6 text-green-500" />
                                                        : <ToggleLeft className="w-6 h-6 text-gray-400" />
                                                    }
                                                </button>
                                            </td>
                                            {/* İşlemler */}
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => { setEditingService(s); setShowForm(true); }}
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                                        title="Düzenle"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(s.id, s.name)}
                                                        disabled={isPending}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                                                        title="Sil"
                                                    >
                                                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Form Dialog */}
            {showForm && (
                <ServiceFormDialog
                    service={editingService}
                    currency={currency}
                    onClose={() => { setShowForm(false); setEditingService(null); }}
                />
            )}
        </div>
    );
}
