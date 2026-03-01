'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/notifications';

interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    is_read: boolean;
    created_at: string;
}

export function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        let mounted = true;

        async function loadNotifications() {
            if (!mounted) return;
            setIsLoading(true);
            try {
                const result = await getNotifications();
                if (mounted && result.success && result.data) {
                    setNotifications(result.data as Notification[]);
                }
            } catch {
                // AbortError veya diğer hatalar sessizce devam et
            } finally {
                if (mounted) setIsLoading(false);
            }
        }

        // Strict mode'da AbortError'ı önlemek için küçük gecikme
        const timer = setTimeout(loadNotifications, 50);
        return () => { mounted = false; clearTimeout(timer); };
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function refreshNotifications() {
        try {
            const result = await getNotifications();
            if (result.success && result.data) {
                setNotifications(result.data as Notification[]);
            }
        } catch {
            // sessizce devam et
        }
    }

    async function handleMarkAsRead(id: string) {
        try {
            await markNotificationAsRead({ notificationId: id });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch {
            // sessizce devam et
        }
    }

    async function handleMarkAllAsRead() {
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch {
            // sessizce devam et
        }
    }

    const typeIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const typeBg = (type: string) => {
        switch (type) {
            case 'warning': return 'bg-amber-50 dark:bg-amber-900/10';
            case 'success': return 'bg-green-50 dark:bg-green-900/10';
            default: return 'bg-blue-50 dark:bg-blue-900/10';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) refreshNotifications(); }}
                className="h-10 w-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#135bec] hover:border-[#135bec]/50 transition-colors relative"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-800">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Bildirimler</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-[#135bec] hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Tümünü Okundu İşaretle
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {isLoading && (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-slate-200 border-t-[#135bec] rounded-full animate-spin"></div>
                            </div>
                        )}
                        {!isLoading && notifications.length > 0 && notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    type="button"
                                    onClick={() => { if (notification.is_read) return; handleMarkAsRead(notification.id); }}
                                    className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/5' : ''
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${typeBg(notification.type)}`}>
                                            {typeIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-sm font-medium ${!notification.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <span className="h-2 w-2 bg-[#135bec] rounded-full shrink-0"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: tr })}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                        ))}
                        {!isLoading && notifications.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Henüz bildiriminiz yok.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
