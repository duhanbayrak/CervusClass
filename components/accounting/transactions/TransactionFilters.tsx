'use client';

import { Search, Filter } from 'lucide-react';
import type { FinanceCategory, FinanceAccount } from '@/types/accounting';

interface TransactionFiltersProps {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    categoryFilter: string;
    onCategoryChange: (val: string) => void;
    accountFilter: string;
    onAccountChange: (val: string) => void;
    categories: FinanceCategory[];
    accounts: FinanceAccount[];
}

export function TransactionFilters({ // NOSONAR
    searchTerm,
    onSearchChange,
    categoryFilter,
    onCategoryChange,
    accountFilter,
    onAccountChange,
    categories,
    accounts,
}: Readonly<TransactionFiltersProps>) {
    const selectClass = 'pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer';

    return (
        <div className="flex gap-3 flex-1 w-full sm:w-auto flex-wrap">
            {/* Arama */}
            <div className="relative flex-1 sm:max-w-xs min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Açıklama veya referans ara..."
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
            </div>

            {/* Kategori filtresi */}
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                    value={categoryFilter}
                    onChange={e => onCategoryChange(e.target.value)}
                    className={selectClass}
                >
                    <option value="all">Tüm Kategoriler</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Hesap filtresi */}
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                    value={accountFilter}
                    onChange={e => onAccountChange(e.target.value)}
                    className={selectClass}
                >
                    <option value="all">Tüm Hesaplar</option>
                    {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
