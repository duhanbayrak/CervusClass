'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ListTree } from 'lucide-react';
import type { FinanceSettings, FinanceCategory } from '@/types/accounting';
import { GeneralSettings } from './GeneralSettings';
import { CategoryManager } from './CategoryManager';

/** Muhasebe ayarları sayfasının sekme yapısı */
interface SettingsContentProps {
    settings: FinanceSettings | null;
    incomeCategories: FinanceCategory[];
    expenseCategories: FinanceCategory[];
}

export function SettingsContent({ // NOSONAR
    settings,
    incomeCategories,
    expenseCategories,
}: Readonly<SettingsContentProps>) {
    const [activeTab, setActiveTab] = useState<'general' | 'categories'>('general');
    const router = useRouter();

    // Router yenileme fonksiyonu
    const handleRefresh = () => {
        router.refresh();
    };

    const tabs = [
        { id: 'general' as const, label: 'Genel Ayarlar', icon: Settings },
        { id: 'categories' as const, label: 'Kategori Yönetimi', icon: ListTree },
    ];

    return (
        <div className="space-y-6">
            {/* Sekme navigasyonu */}
            <div className="flex gap-1 rounded-xl bg-white/60 dark:bg-white/5 p-1 border border-gray-200 dark:border-white/10 w-fit">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                                transition-all duration-200 cursor-pointer
                                ${isActive
                                    ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* İçerik alanı */}
            {activeTab === 'general' && (
                <GeneralSettings settings={settings} onSave={handleRefresh} />
            )}
            {activeTab === 'categories' && (
                <CategoryManager
                    incomeCategories={incomeCategories}
                    expenseCategories={expenseCategories}
                    onUpdate={handleRefresh}
                />
            )}
        </div>
    );
}
