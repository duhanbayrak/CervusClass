'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    TrendingUp,
    TrendingDown,
    Landmark,
    FileBarChart,
    Settings,
} from 'lucide-react';

// Muhasebe modülü alt navigasyon sekmeleri
const ACCOUNTING_TABS = [
    { title: 'Dashboard', href: '/admin/accounting', icon: LayoutDashboard },
    { title: 'Öğrenci Ücretleri', href: '/admin/accounting/students', icon: Users },
    { title: 'Gelirler', href: '/admin/accounting/income', icon: TrendingUp },
    { title: 'Giderler', href: '/admin/accounting/expenses', icon: TrendingDown },
    { title: 'Hesaplar', href: '/admin/accounting/accounts', icon: Landmark },
    { title: 'Raporlar', href: '/admin/accounting/reports', icon: FileBarChart },
    { title: 'Ayarlar', href: '/admin/accounting/settings', icon: Settings },
];

/**
 * Muhasebe modülü alt navigasyon çubuğu.
 * Her alt sayfa için sekme butonu içerir.
 * Aktif sekme vurgulanır (pathname ile eşleşme).
 */
export default function AccountingSubNav() {
    const pathname = usePathname();

    // Aktif sekmeyi belirle — tam eşleşme veya alt rota
    const isActive = (href: string) => {
        if (href === '/admin/accounting') {
            return pathname === '/admin/accounting';
        }
        return pathname.startsWith(href);
    };

    return (
        <nav className="w-full border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-1 overflow-x-auto px-1 py-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                {ACCOUNTING_TABS.map((tab) => {
                    const active = isActive(tab.href);
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                                whitespace-nowrap transition-all duration-200 shrink-0
                                ${active
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }
                            `}
                        >
                            <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                            <span>{tab.title}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
