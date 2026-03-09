'use client';

import { useState } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import MobileSidebar from '@/components/dashboard/mobile-sidebar';
import DashboardHeader from '@/components/dashboard/header';
import { ADMIN_NAV } from '@/lib/navigation';
import UserSelectionDialog from '@/components/dashboard/admin/user-selection-dialog';

export default function AdminLayout({ // NOSONAR
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [isUserSelectionOpen, setIsUserSelectionOpen] = useState(false);

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
                    mobileNav={
                        <MobileSidebar
                            items={ADMIN_NAV}
                            basePath="/admin"
                            title="Cervus Class"
                            subtitle="Yönetici Paneli"
                        />
                    }
                />
                <div className="flex-1 overflow-y-auto p-2 md:p-8 scroll-smooth">
                    {children}
                </div>
                <UserSelectionDialog
                    open={isUserSelectionOpen}
                    onOpenChange={setIsUserSelectionOpen}
                />
            </main>
        </div>
    );
}
