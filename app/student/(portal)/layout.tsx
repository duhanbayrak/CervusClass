'use client';

import Sidebar from '@/components/dashboard/sidebar';
import MobileSidebar from '@/components/dashboard/mobile-sidebar';
import DashboardHeader from '@/components/dashboard/header';
import { STUDENT_NAV } from '@/lib/navigation';

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-[#f6f6f8] dark:bg-[#101622] overflow-hidden font-sans">
            <Sidebar
                items={STUDENT_NAV}
                basePath="/student"
                title="Cervus Class"
                subtitle="Öğrenci Portalı"
            />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <DashboardHeader
                    title="Tekrar Hoşgeldiniz!"
                    description="Günlük özetiniz ve yaklaşan etkinlikleriniz."
                    actionButtonText="Etüt Talep Et"
                    mobileNav={
                        <MobileSidebar
                            items={STUDENT_NAV}
                            basePath="/student"
                            title="Cervus Class"
                            subtitle="Öğrenci Portalı"
                        />
                    }
                />
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    {children}
                </div>
            </main>
        </div>
    );
}
