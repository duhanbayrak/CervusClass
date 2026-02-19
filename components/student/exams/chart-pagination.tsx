'use client'

interface ChartPaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function ChartPagination({ currentPage, totalPages, onPageChange }: ChartPaginationProps) {
    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-center gap-3 mt-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Önceki
            </button>
            <span className="text-xs text-muted-foreground font-medium tabular-nums">
                {currentPage + 1} / {totalPages}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed"
            >
                Sonraki
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>
        </div>
    )
}

/** Veriyi sayfalara böl, son sayfayı varsayılan yap */
export function usePaginatedData<T>(data: T[], pageSize: number = 5) {
    const totalPages = Math.ceil(data.length / pageSize)
    const defaultPage = Math.max(0, totalPages - 1) // son sayfa

    // İlk sayfada gösterilecek eleman sayısı
    // Eğer tam bölünüyorsa pageSize kadar, değilse kalan kadar
    const remainder = data.length % pageSize
    const firstPageSize = remainder === 0 ? pageSize : remainder

    return {
        totalPages,
        defaultPage,
        getPageData: (page: number) => {
            if (data.length === 0) return []

            // İlk sayfa için özel hesaplama
            if (page === 0) {
                return data.slice(0, firstPageSize)
            }

            // Diğer sayfalar için ofset hesaplama
            // İlk sayfadaki elemanları geç, sonraki her sayfa için pageSize kadar ilerle
            const offset = firstPageSize + (page - 1) * pageSize
            return data.slice(offset, offset + pageSize)
        },
    }
}
