'use client';

import { Search, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from './notification-dropdown';

interface DashboardHeaderProps {
    title: string;
    description: string;
    actionButtonText?: string;
    onActionClick?: () => void;
    mobileNav?: React.ReactNode;
}

export default function DashboardHeader({ title, description, actionButtonText, onActionClick, mobileNav }: Readonly<DashboardHeaderProps>) { // NOSONAR
    return (
        <header className="h-20 bg-white/80 dark:bg-[#151c2b]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between z-10 shrink-0 sticky top-0">
            <div className="flex items-center gap-4">
                {mobileNav}
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {title}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {description}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative w-80 hidden md:block">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-5 h-5" />
                    </div>
                    <Input
                        className="pl-10 pr-4 h-10 border-none bg-slate-100 dark:bg-slate-800 focus-visible:ring-[#135bec] focus-visible:ring-offset-0"
                        placeholder="Search..."
                    />
                </div>

                {/* Notifications */}
                <NotificationDropdown />

                {/* Optional Action Button */}
                {actionButtonText && (
                    <Button
                        onClick={onActionClick}
                        className="hidden md:flex items-center gap-2 bg-[#135bec] hover:bg-blue-700 text-white font-medium"
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span>{actionButtonText}</span>
                    </Button>
                )}
            </div>
        </header>
    );
}

