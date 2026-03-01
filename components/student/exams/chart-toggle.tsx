'use client'

interface ChartToggleProps {
    isBarChart: boolean
    onChange: (isBar: boolean) => void
}

export function ChartToggle({ isBarChart, onChange }: Readonly<ChartToggleProps>) { // NOSONAR
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onChange(false)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${!isBarChart // NOSONAR
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                title="Çizgi Grafik"
            >
                {/* Line chart icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                Çizgi
            </button>
            <button
                onClick={() => onChange(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isBarChart
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                title="Çubuk Grafik"
            >
                {/* Bar chart icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" x2="12" y1="20" y2="10" />
                    <line x1="18" x2="18" y1="20" y2="4" />
                    <line x1="6" x2="6" y1="20" y2="14" />
                </svg>
                Çubuk
            </button>
        </div>
    )
}
