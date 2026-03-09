'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Loader2, Tag } from 'lucide-react';
import type { FinanceCategory } from '@/types/accounting';
import {
    createFinanceCategory,
    deleteFinanceCategory,
} from '@/lib/actions/accounting';

interface CategoryManagerProps {
    incomeCategories: FinanceCategory[];
    expenseCategories: FinanceCategory[];
    onUpdate: () => void;
}

export function CategoryManager({ // NOSONAR
    incomeCategories,
    expenseCategories,
    onUpdate,
}: Readonly<CategoryManagerProps>) {
    const [isPending, startTransition] = useTransition();
    const [activeType, setActiveType] = useState<'income' | 'expense'>('income');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [message, setMessage] = useState('');

    const categories = activeType === 'income' ? incomeCategories : expenseCategories;

    // Yeni kategori ekle
    const handleAdd = () => {
        if (!newCategoryName.trim()) return;
        startTransition(async () => {
            const result = await createFinanceCategory({
                name: newCategoryName.trim(),
                type: activeType,
            });

            if (result.success) {
                setNewCategoryName('');
                setMessage('Kategori eklendi.');
                onUpdate();
            } else {
                setMessage(`Hata: ${result.error}`);
            }
            setTimeout(() => setMessage(''), 3000);
        });
    };

    // Kategori sil
    const handleDelete = (categoryId: string) => {
        startTransition(async () => {
            const result = await deleteFinanceCategory(categoryId);

            if (result.success) {
                setMessage('Kategori silindi.');
                onUpdate();
            } else {
                setMessage(`Hata: ${result.error}`);
            }
            setTimeout(() => setMessage(''), 3000);
        });
    };

    const cardClass = 'rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6';

    return (
        <div className="space-y-6">
            {/* Tip seçici */}
            <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-white/5 p-1 w-fit">
                <button
                    onClick={() => setActiveType('income')}
                    className={`
                        px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer
                        ${activeType === 'income'
                            ? 'bg-green-500 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }
                    `}
                >
                    Gelir Kategorileri ({incomeCategories.length})
                </button>
                <button
                    onClick={() => setActiveType('expense')}
                    className={`
                        px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer
                        ${activeType === 'expense'
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }
                    `}
                >
                    Gider Kategorileri ({expenseCategories.length})
                </button>
            </div>

            {/* Kategori listesi */}
            <div className={cardClass}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {activeType === 'income' ? 'Gelir' : 'Gider'} Kategorileri
                </h3>

                <div className="space-y-2 mb-4">
                    {categories.map(category => (
                        <div
                            key={category.id}
                            className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] px-4 py-3"
                        >
                            <div className="flex items-center gap-3">
                                <Tag className={`w-4 h-4 ${activeType === 'income' ? 'text-green-500' : 'text-red-500'}`} />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {category.name}
                                </span>
                                {category.is_system && (
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                        Sistem
                                    </span>
                                )}
                            </div>
                            {!category.is_system && (
                                <button
                                    onClick={() => handleDelete(category.id)}
                                    disabled={isPending}
                                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
                                    title="Kategoriyi sil"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    {categories.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                            Henüz kategori bulunmuyor.
                        </p>
                    )}
                </div>

                {/* Yeni kategori ekleme */}
                <div className="flex gap-3 items-end">
                    <div className="flex-1">
                        <label htmlFor="newCategoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Yeni Kategori Adı
                        </label>
                        <input
                            id="newCategoryName"
                            type="text"
                            placeholder={activeType === 'income' ? 'örn: Kurs Geliri' : 'örn: Temizlik Gideri'}
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={isPending || !newCategoryName.trim()}
                        className={`
                            flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium
                            transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
                            ${activeType === 'income'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }
                        `}
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        Ekle
                    </button>
                </div>

                {/* Mesaj */}
                {message && (
                    <p className={`mt-3 text-sm ${message.startsWith('Hata') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
