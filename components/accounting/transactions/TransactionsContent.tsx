'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { FinanceTransaction, FinanceCategory, FinanceAccount } from '@/types/accounting';
import { TransactionList } from './TransactionList';
import { TransactionFilters } from './TransactionFilters';
import { TransactionFormDialog } from './TransactionFormDialog';

interface TransactionsContentProps {
    transactions: FinanceTransaction[];
    categories: FinanceCategory[];
    accounts: FinanceAccount[];
    type: 'income' | 'expense';
}

export function TransactionsContent({
    transactions,
    categories,
    accounts,
    type,
}: TransactionsContentProps) {
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [accountFilter, setAccountFilter] = useState('all');

    // Filtrele
    const filtered = transactions.filter(t => {
        const matchesSearch = !searchTerm ||
            t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.reference_no?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === 'all' || t.category_id === categoryFilter;
        const matchesAccount = accountFilter === 'all' || t.account_id === accountFilter;

        return matchesSearch && matchesCategory && matchesAccount;
    });

    // Toplam
    const total = filtered.reduce((sum, t) => sum + Number(t.amount), 0);

    return (
        <div className="space-y-4">
            {/* Üst bar — filtreler + buton */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <TransactionFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    categoryFilter={categoryFilter}
                    onCategoryChange={setCategoryFilter}
                    accountFilter={accountFilter}
                    onAccountChange={setAccountFilter}
                    categories={categories}
                    accounts={accounts}
                />
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    {type === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
                </button>
            </div>

            {/* Toplam */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
                {filtered.length} kayıt • Toplam:{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(total)}
                </span>
            </div>

            {/* Liste */}
            <TransactionList transactions={filtered} type={type} />

            {/* Yeni işlem dialog */}
            {showForm && (
                <TransactionFormDialog
                    type={type}
                    categories={categories}
                    accounts={accounts}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
}
