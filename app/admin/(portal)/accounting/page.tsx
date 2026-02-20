import { Suspense } from 'react';
import {
    getFinancialSummary,
    getMonthlyTrends,
    getCategoryDistribution,
    getOverdueInstallments,
} from '@/lib/actions/finance-reports';
import { getRecentTransactions } from '@/lib/actions/accounting';
import DashboardContent from '@/components/accounting/dashboard/DashboardContent';

export const metadata = {
    title: 'Muhasebe Dashboard — Cervus Class',
};

// Dashboard yüklenirken gösterilecek iskelet
function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Özet kartları iskeleti */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-white/5" />
                ))}
            </div>
            {/* Grafik iskeleti */}
            <div className="h-80 rounded-2xl bg-gray-100 dark:bg-white/5" />
        </div>
    );
}

export default async function AccountingDashboardPage() {
    // Paralel veri çekme
    const [summary, trends, incomeDistribution, expenseDistribution, overdueInstallments, recentTransactions] =
        await Promise.all([
            getFinancialSummary(),
            getMonthlyTrends(),
            getCategoryDistribution('income'),
            getCategoryDistribution('expense'),
            getOverdueInstallments(),
            getRecentTransactions(10),
        ]);

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent
                summary={summary}
                trends={trends}
                incomeDistribution={incomeDistribution}
                expenseDistribution={expenseDistribution}
                overdueInstallments={overdueInstallments}
                recentTransactions={recentTransactions}
            />
        </Suspense>
    );
}
