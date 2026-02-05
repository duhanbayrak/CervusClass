import { getAdminDashboardStats } from '@/lib/actions/dashboard';
import { Users, GraduationCap, School } from 'lucide-react';

export default async function AdminDashboardPage() {
    const stats = await getAdminDashboardStats();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="tracking-tight text-sm font-medium">Toplam Öğrenci</h3>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="p-0 pt-2">
                    <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                    <p className="text-xs text-muted-foreground">Kayıtlı aktif öğrenci sayısı</p>
                </div>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="tracking-tight text-sm font-medium">Toplam Öğretmen</h3>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="p-0 pt-2">
                    <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
                    <p className="text-xs text-muted-foreground">Kayıtlı eğitmen sayısı</p>
                </div>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="tracking-tight text-sm font-medium">Aktif Sınıflar</h3>
                    <School className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="p-0 pt-2">
                    <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
                    <p className="text-xs text-muted-foreground">Tanımlı sınıf sayısı</p>
                </div>
            </div>
            <div className="col-span-full">
                {stats?.debug && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                        <p className="font-bold">Debug Info</p>
                        <p>{stats.debug}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

