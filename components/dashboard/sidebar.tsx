'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NavItem } from '@/lib/navigation';
import { School, LogOut, ChevronUp, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useUserRole } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SidebarProps {
    items: NavItem[];
    basePath: string; // e.g., '/student' to check for active state prefix
    title?: string;
    subtitle?: string;
    className?: string;
    onNavigate?: () => void;
}

export default function Sidebar({ items, basePath, title = "CervusClass", subtitle = "Portal", className, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const { profile, role, signOut, loading } = useUserRole();

    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async (event: Event) => {
        event.preventDefault();
        setIsSigningOut(true);
        await signOut();
    };

    return (
        <aside className={cn("hidden md:flex w-72 flex-shrink-0 bg-white dark:bg-[#151c2b] border-r border-slate-200 dark:border-slate-800 flex-col transition-all duration-300 h-screen sticky top-0", className)}>
            {/* Branding */}
            <div className="p-6 flex items-center gap-3">
                <div className="bg-[#135bec]/10 p-2 rounded-lg text-[#135bec]">
                    <NextImage src="/deer-logo.svg" alt="Cervus Class Logo" width={32} height={32} className="w-8 h-8 object-contain" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto py-2">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group relative",
                                isActive
                                    ? "bg-[#135bec]/10 text-[#135bec]"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#135bec]"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-[#135bec]" : "text-slate-500 group-hover:text-[#135bec]")} />
                            <span className="font-medium text-sm">{item.title}</span>

                            {item.badge && (
                                <span className={cn(
                                    "ml-auto text-white text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    isActive ? "bg-[#135bec]" : "bg-red-500"
                                )}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile / Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div suppressHydrationWarning className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors w-full group">
                            <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-700 shadow-sm">
                                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                                <AvatarFallback>{profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col items-start overflow-hidden flex-1 gap-0.5">
                                {loading ? (
                                    <>
                                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate w-full text-left">
                                            {profile?.full_name || 'Kullanıcı'}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate w-full text-left capitalize">
                                            {role || 'Misafir'}
                                        </span>
                                    </>
                                )}
                            </div>
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56" forceMount>
                        <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600"
                            onSelect={handleSignOut}
                            disabled={isSigningOut}
                        >
                            {isSigningOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                            <span>{isSigningOut ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}
