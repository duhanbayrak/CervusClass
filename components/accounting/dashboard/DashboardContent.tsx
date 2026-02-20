'use client';

import { useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    BadgeCheck,
    Clock,
    AlertTriangle,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import type {
    FinancialSummary,
    MonthlyTrend,
    CategoryDistribution,
    OverdueInstallment,
    FinanceTransaction,
} from '@/types/accounting';

// =============================================
// Props
// =============================================
interface DashboardContentProps {
    summary: FinancialSummary;
    trends: MonthlyTrend[];
    incomeDistribution: CategoryDistribution[];
    expenseDistribution: CategoryDistribution[];
    overdueInstallments: OverdueInstallment[];
    recentTransactions: FinanceTransaction[];
}

// =============================================
// Yardımcı Fonksiyonlar
// =============================================

/** Para formatı */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Kısa para formatı (K/M) */
function formatShort(amount: number): string {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
    return amount.toFixed(0);
}

/** Tarih formatı */
function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'short',
    });
}

/** Ay adı (kısa) */
function monthLabel(monthStr: string): string {
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const monthNum = parseInt(monthStr.split('-')[1], 10);
    return monthNames[monthNum - 1] || monthStr;
}

// =============================================
// Renk paleti
// =============================================
const CATEGORY_COLORS = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-pink-500',
];

// =============================================
// Ana Bileşen
// =============================================
export default function DashboardContent({
    summary,
    trends,
    incomeDistribution,
    expenseDistribution,
    overdueInstallments,
    recentTransactions,
}: DashboardContentProps) {
    const [distributionTab, setDistributionTab] = useState<'income' | 'expense'>('expense');

    // Trend grafiği için max değer hesapla
    const maxTrendValue = Math.max(
        ...trends.map(t => Math.max(t.income, t.expense)),
        1 // sıfıra bölme engeli
    );

    // Aktif kategori dağılımı
    const activeDistribution = distributionTab === 'income' ? incomeDistribution : expenseDistribution;

    return (
        <div className="space-y-6">
            {/* Sayfa Başlığı */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Finansal Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {new Date().getFullYear()} yılı finansal özet
                </p>
            </div>

            {/* ==================== ÖZET KARTLAR ==================== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Toplam Gelir */}
                <SummaryCard
                    title="Toplam Gelir"
                    value={formatCurrency(summary.total_income)}
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="emerald"
                />
                {/* Toplam Gider */}
                <SummaryCard
                    title="Toplam Gider"
                    value={formatCurrency(summary.total_expense)}
                    icon={<TrendingDown className="w-5 h-5" />}
                    color="red"
                />
                {/* Net Kâr */}
                <SummaryCard
                    title="Net Kâr"
                    value={formatCurrency(summary.net_profit)}
                    icon={<Wallet className="w-5 h-5" />}
                    color={summary.net_profit >= 0 ? 'blue' : 'red'}
                />
                {/* Tahsilat Oranı */}
                <SummaryCard
                    title="Tahsilat Oranı"
                    value={`%${summary.collection_rate}`}
                    icon={<PieChart className="w-5 h-5" />}
                    color="violet"
                />
                {/* Tahsil Edilen */}
                <SummaryCard
                    title="Tahsil Edilen"
                    value={formatCurrency(summary.collected_amount)}
                    icon={<BadgeCheck className="w-5 h-5" />}
                    color="emerald"
                />
                {/* Bekleyen */}
                <SummaryCard
                    title="Bekleyen"
                    value={formatCurrency(summary.pending_amount)}
                    icon={<Clock className="w-5 h-5" />}
                    color="amber"
                />
                {/* Vadesi Geçmiş */}
                <SummaryCard
                    title="Vadesi Geçmiş"
                    value={formatCurrency(summary.overdue_amount)}
                    icon={<AlertTriangle className="w-5 h-5" />}
                    color="red"
                    highlight={summary.overdue_amount > 0}
                />
            </div>

            {/* ==================== GRAFİK + KATEGORİ ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Aylık Trend Grafiği — 2/3 genişlik */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                        Aylık Gelir - Gider
                    </h2>

                    {/* Bar Chart — CSS-only */}
                    <div className="flex items-end gap-1 sm:gap-2 h-56">
                        {trends.map((t) => (
                            <div key={t.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                {/* Tutar tooltip'leri */}
                                <div className="flex gap-0.5 text-[10px] text-gray-400 leading-tight text-center">
                                    {t.income > 0 && <span className="text-emerald-500">{formatShort(t.income)}</span>}
                                    {t.expense > 0 && <span className="text-red-400">{formatShort(t.expense)}</span>}
                                </div>

                                {/* Bar'lar */}
                                <div className="flex gap-0.5 w-full items-end flex-1">
                                    {/* Gelir bar */}
                                    <div
                                        className="flex-1 rounded-t-sm bg-emerald-500/80 transition-all duration-500 min-h-[2px]"
                                        style={{ height: `${(t.income / maxTrendValue) * 100}%` }}
                                    />
                                    {/* Gider bar */}
                                    <div
                                        className="flex-1 rounded-t-sm bg-red-400/80 transition-all duration-500 min-h-[2px]"
                                        style={{ height: `${(t.expense / maxTrendValue) * 100}%` }}
                                    />
                                </div>

                                {/* Ay etiketi */}
                                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {monthLabel(t.month)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-emerald-500/80" /> Gelir
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-red-400/80" /> Gider
                        </span>
                    </div>
                </div>

                {/* Kategori Dağılımı — 1/3 genişlik */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Kategori Dağılımı
                        </h2>
                        {/* Toggle */}
                        <div className="flex rounded-lg bg-gray-100 dark:bg-white/5 p-0.5">
                            <button
                                onClick={() => setDistributionTab('income')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${distributionTab === 'income'
                                        ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                Gelir
                            </button>
                            <button
                                onClick={() => setDistributionTab('expense')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${distributionTab === 'expense'
                                        ? 'bg-white dark:bg-gray-800 text-red-500 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                Gider
                            </button>
                        </div>
                    </div>

                    {activeDistribution.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">
                            Henüz veri yok
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {activeDistribution.map((cat, idx) => (
                                <div key={cat.category_name} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700 dark:text-gray-300 truncate">
                                            {cat.category_icon && <span className="mr-1">{cat.category_icon}</span>}
                                            {cat.category_name}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400 font-medium ml-2 shrink-0">
                                            %{cat.percentage}
                                        </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}`}
                                            style={{ width: `${cat.percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {formatCurrency(cat.amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== ALT BÖLÜM ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vadesi Geçmiş Taksitler */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Vadesi Geçmiş Taksitler
                        </h2>
                        {overdueInstallments.length > 0 && (
                            <span className="ml-auto px-2 py-0.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-full">
                                {overdueInstallments.length}
                            </span>
                        )}
                    </div>

                    {overdueInstallments.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">
                            ✅ Vadesi geçmiş taksit yok
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {overdueInstallments.slice(0, 15).map((item) => (
                                <div
                                    key={item.installment_id}
                                    className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {item.student_name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Vade: {formatDate(item.due_date)} · {item.days_overdue} gün gecikme
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-red-600 dark:text-red-400 shrink-0 ml-3">
                                        {formatCurrency(item.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Son İşlemler */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                        Son İşlemler
                    </h2>

                    {recentTransactions.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">
                            Henüz işlem yok
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {recentTransactions.slice(0, 8).map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    {/* Gelir/Gider ikonu */}
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tx.type === 'income'
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10'
                                            : 'bg-red-50 dark:bg-red-500/10'
                                        }`}>
                                        {tx.type === 'income'
                                            ? <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            : <ArrowDownRight className="w-4 h-4 text-red-500 dark:text-red-400" />
                                        }
                                    </div>

                                    {/* Detay */}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {tx.category?.name || tx.description || 'İşlem'}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {tx.account?.name} · {formatDate(tx.transaction_date)}
                                        </p>
                                    </div>

                                    {/* Tutar */}
                                    <span className={`text-sm font-semibold shrink-0 ${tx.type === 'income'
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-red-500 dark:text-red-400'
                                        }`}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// =============================================
// Alt Bileşen: Özet Kartı
// =============================================

interface SummaryCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: 'emerald' | 'red' | 'blue' | 'amber' | 'violet';
    highlight?: boolean;
}

const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        icon: 'text-emerald-600 dark:text-emerald-400',
        text: 'text-emerald-700 dark:text-emerald-300',
    },
    red: {
        bg: 'bg-red-50 dark:bg-red-500/10',
        icon: 'text-red-500 dark:text-red-400',
        text: 'text-red-600 dark:text-red-400',
    },
    blue: {
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-700 dark:text-blue-300',
    },
    amber: {
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        icon: 'text-amber-600 dark:text-amber-400',
        text: 'text-amber-700 dark:text-amber-300',
    },
    violet: {
        bg: 'bg-violet-50 dark:bg-violet-500/10',
        icon: 'text-violet-600 dark:text-violet-400',
        text: 'text-violet-700 dark:text-violet-300',
    },
};

function SummaryCard({ title, value, icon, color, highlight }: SummaryCardProps) {
    const c = colorMap[color];
    return (
        <div className={`relative overflow-hidden rounded-2xl border p-4 transition-shadow hover:shadow-md ${highlight
                ? 'border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5'
                : 'border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900'
            }`}>
            {/* İkon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>
                <span className={c.icon}>{icon}</span>
            </div>

            {/* Değer */}
            <p className="text-xl font-bold text-gray-900 dark:text-white">
                {value}
            </p>

            {/* Başlık */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {title}
            </p>

            {/* Highlight pulse */}
            {highlight && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            )}
        </div>
    );
}
