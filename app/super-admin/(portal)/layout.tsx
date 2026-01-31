'use client';

import Sidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';
import { SUPER_ADMIN_NAV } from '@/lib/navigation';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-[#f6f6f8] dark:bg-[#101622] overflow-hidden font-sans">
            <Sidebar
                items={SUPER_ADMIN_NAV}
                basePath="/super-admin"
                title="Cervus Manager"
                subtitle="Süper Admin"
            />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <DashboardHeader
                    title="Platform Yönetimi"
                    description="Global sistem ayarları ve kurumlar."
                    actionButtonText="Yeni Kurum"
                />
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    {children}
                </div>
            </main>
        </div>
    );
}
