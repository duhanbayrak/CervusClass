import { getAdminDashboardStats } from '@/lib/actions/dashboard';
import { DashboardGrid } from '@/components/dashboard/admin/dashboard-grid';

export default async function AdminDashboardPage() {
    const stats = await getAdminDashboardStats();

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

