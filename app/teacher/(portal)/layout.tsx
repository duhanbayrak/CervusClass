'use client';

import Sidebar from '@/components/dashboard/sidebar';
import MobileSidebar from '@/components/dashboard/mobile-sidebar';
import DashboardHeader from '@/components/dashboard/header';
import { TEACHER_NAV } from '@/lib/navigation';

export default function TeacherLayout({ // NOSONAR
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <div className="flex h-screen w-full bg-[#f6f6f8] dark:bg-[#101622] overflow-hidden font-sans">
            <Sidebar
                items={TEACHER_NAV}
                basePath="/teacher"
                title="Cervus Class"
                subtitle="Öğretmen Portalı"
            />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <DashboardHeader
                    title="Eğitmen Paneli"
                    description="Sınıflarınızı ve programınızı yönetin."
                    mobileNav={
                        <MobileSidebar
                            items={TEACHER_NAV}
                            basePath="/teacher"
                            title="Cervus Class"
                            subtitle="Öğretmen Portalı"
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
