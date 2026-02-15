import React from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message = 'Yükleniyor...' }: LoadingScreenProps) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-[#0d121b] animate-in fade-in duration-300">
            <div className="relative mb-8">
                {/* Logo Background Glow */}
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>

                {/* Logo */}
                <div className="relative w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    <Image
                        src="/deer-logo.svg"
                        alt="Cervus Class"
                        width={64}
                        height={64}
                        className="w-16 h-16 object-contain animate-bounce"
                        style={{ animationDuration: '2s' }}
                    />
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 animate-pulse">
                    {message}
                </h3>
            </div>
        </div>
    );
}
