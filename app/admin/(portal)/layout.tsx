'use client';

import Sidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';
import { ADMIN_NAV } from '@/lib/navigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-[#f6f6f8] dark:bg-[#101622] overflow-hidden font-sans">
            <Sidebar
                items={ADMIN_NAV}
                basePath="/admin"
                title="Cervus Class"
                subtitle="Yönetici Paneli"
            />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <DashboardHeader
                    title="Yönetim"
                    description="Kurumunuza genel bakış."
                    actionButtonText="Kullanıcı Ekle"
                />
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    {children}
                </div>
            </main>
        </div>
    );
}
