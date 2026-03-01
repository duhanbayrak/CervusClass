'use client';

import { ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import type { FinanceTransaction } from '@/types/accounting';

interface TransactionListProps {
    transactions: FinanceTransaction[];
    type: 'income' | 'expense';
}

/** Tarih formatı */
function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function TransactionList({ transactions, type }: TransactionListProps) { // NOSONAR
    const cardClass = 'rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5';

    if (transactions.length === 0) {
        return (
            <div className={`${cardClass} text-center py-12`}>
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Henüz {type === 'income' ? 'gelir' : 'gider'} kaydı bulunmuyor.
                </p>
            </div>
        );
    }

    return (
        <div className={`${cardClass} overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-white/5">
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarih</th>
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Açıklama</th>
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kategori</th>
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hesap</th>
                            <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tutar</th>
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Referans</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {transactions.map(tx => {
                            const txWithRels = tx as FinanceTransaction & {
                                category?: { name: string };
                                account?: { name: string };
                            };

                            return (
                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        {formatDate(tx.transaction_date)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {type === 'income' ? (
                                                <ArrowUpRight className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            ) : (
                                                <ArrowDownRight className="w-4 h-4 text-red-500 flex-shrink-0" />
                                            )}
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                {tx.description || '—'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {txWithRels.category?.name || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {txWithRels.account?.name || '—'}
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-semibold text-right whitespace-nowrap ${type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {type === 'income' ? '+' : '-'}
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(tx.amount))}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400">
                                        {tx.reference_no || '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
