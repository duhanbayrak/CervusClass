'use client'

import { useEffect, useCallback, type ReactNode } from 'react'

interface ChartModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    subtitle?: string
    children: ReactNode
}

export function ChartModal({ isOpen, onClose, title, subtitle, children }: ChartModalProps) {
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
    }, [onClose])

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [isOpen, handleEscape])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Kapat"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-default"
                onClick={onClose}
                onKeyDown={(e) => e.key === 'Escape' && onClose()}
            />

            {/* Modal Content */}
            <div className="relative w-[95vw] h-[90vh] bg-card border rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30 shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground mr-2 hidden sm:inline">
                            ESC ile kapat
                        </span>
                        <button
                            onClick={onClose}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                            title="Kapat"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="flex-1 p-6 min-h-0">
                    {children}
                </div>
            </div>
        </div>
    )
}

/** Grafiklerin üzerine gelince "büyüt" ikonu gösteren sarmalayıcı */
export function ExpandableChartWrapper({
    children,
    onClick,
    className = '',
}: {
    children: ReactNode
    onClick: () => void
    className?: string
}) {
    return (
        <div className={`relative group ${className}`}>
            <button
                type="button"
                aria-label="Grafiği büyüt"
                className="absolute inset-0 z-10 cursor-pointer w-full h-full bg-transparent"
                onClick={onClick}
                onKeyDown={(e) => e.key === 'Enter' && onClick()}
            />
            {children}
            {/* Expand icon overlay */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-foreground/80 text-background rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-medium shadow-lg backdrop-blur-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                    Büyüt
                </div>
            </div>
        </div>
    )
}
