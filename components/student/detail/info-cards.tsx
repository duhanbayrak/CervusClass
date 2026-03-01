'use client';

import { useState } from 'react';
import { CheckCheck, Copy } from 'lucide-react';

/**
 * Tek tıkla kopyalanabilir bilgi satırı bileşeni.
 * Tıklanınca değeri panoya kopyalar ve geçici olarak onay ikonu gösterir.
 */
export function CopyableInfoRow({ icon: Icon, label, value, placeholder }: Readonly<{
    // NOSONAR
    icon: React.ElementType;
    label: string;
    value: string | null | undefined;
    placeholder?: string;
}>) {
    const [copied, setCopied] = useState(false);
    const displayValue = value || placeholder || '—';
    const hasTrueValue = !!value;

    // Panoya kopyalama işlemi
    const handleCopy = async () => {
        if (!hasTrueValue) return;
        try {
            await navigator.clipboard.writeText(value ?? '');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API desteklenmiyorsa sessizce geç
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            disabled={!hasTrueValue}
            className={`
                group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left
                transition-all duration-200
                ${hasTrueValue
                    ? 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer active:scale-[0.98]'
                    : 'cursor-default opacity-60'
                }
            `}
        >
            {/* İkon */}
            <div className={`
                flex-shrink-0 p-2 rounded-lg transition-colors duration-200
                ${hasTrueValue
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900/50 dark:group-hover:text-indigo-400'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600'
                }
            `}>
                <Icon className="w-4 h-4" />
            </div>

            {/* Etiket ve Değer */}
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {label}
                </p>
                <p className={`text-sm font-medium truncate ${hasTrueValue ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>
                    {displayValue}
                </p>
            </div>

            {/* Kopyalama göstergesi */}
            {hasTrueValue && (
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {copied ? (
                        <CheckCheck className="w-4 h-4 text-green-500" />
                    ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                </div>
            )}
        </button>
    );
}

/**
 * Mini istatistik kartı bileşeni.
 */
export function StatMiniCard({ icon: Icon, label, value, color }: Readonly<{
    // NOSONAR
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: 'green' | 'blue' | 'red' | 'orange' | 'indigo';
}>) {
    const colorMap = {
        green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
        orange: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    };

    const valueColorMap = {
        green: 'text-emerald-600 dark:text-emerald-400',
        blue: 'text-blue-600 dark:text-blue-400',
        red: 'text-red-600 dark:text-red-400',
        orange: 'text-amber-600 dark:text-amber-400',
        indigo: 'text-indigo-600 dark:text-indigo-400',
    };

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className={`p-2 rounded-lg ${colorMap[color]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
            <span className={`text-lg font-bold tabular-nums ${valueColorMap[color]}`}>
                {value}
            </span>
        </div>
    );
}
