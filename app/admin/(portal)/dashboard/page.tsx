import { getAdminDashboardStats } from '@/lib/actions/dashboard';
import type { DashboardStats } from '@/lib/actions/dashboard';
import { DashboardGrid } from '@/components/dashboard/admin/dashboard-grid';

const EMPTY_STATS: DashboardStats = {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    delayedPayments: 0,
    expectedCollectionThisMonth: 0,
    totalActiveBalance: 0,
    newRegistrations: 0,
};

export default async function AdminDashboardPage() {
    const result = await getAdminDashboardStats();
    const stats = result.success && result.data ? result.data : EMPTY_STATS;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Kontrol Paneli</h2>
                <p className="text-muted-foreground">Okul istatistiklerini buradan takip edebilirsiniz. Kartların yerini değiştirmek için sürükleyip bırakın.</p>
            </div>
            <DashboardGrid stats={stats} />
        </div>
    );
}

