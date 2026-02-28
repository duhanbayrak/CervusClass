'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { getReceiptData } from '@/lib/actions/receipt';

interface ReceiptDownloadButtonProps {
    /** Direkt ödeme ID'si ile makbuz al */
    paymentId?: string;
    /** Taksit ID'si ile en son ödemeyi bulup makbuz al */
    installmentId?: string;
    /** "icon" → sadece ikon buton (listede), "full" → tam buton (dialog'da) */
    variant?: 'icon' | 'full';
}

// Woff dosyasını tarayıcıda fetch edip data URL olarak döndürme yardımcısı
async function fetchFontAsDataUrl(url: string): Promise<string> {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return `data:font/woff;base64,${base64}`;
}

export function ReceiptDownloadButton({ paymentId, installmentId, variant = 'full' }: ReceiptDownloadButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpen = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Sunucudan makbuz verilerini çek
            const result = await getReceiptData(paymentId, installmentId);

            if (!result.success || !result.data) {
                setError(result.error || 'Makbuz verisi alınamadı.');
                return;
            }

            // 2. @react-pdf/renderer'ı lazy yükle — başlangıç bundle'ına dahil olmaz (~400kb kazanç)
            const [{ pdf }, { ReceiptPDF, registerFonts }] = await Promise.all([
                import('@react-pdf/renderer'),
                import('./ReceiptPDF'),
            ]);

            // 3. Fontları data URL olarak yükle (CORS + glyph sorunlarını tamamen çözer)
            const origin = window.location.origin;
            const [regular, bold, italic] = await Promise.all([
                fetchFontAsDataUrl(`${origin}/fonts/NotoSans-Regular.woff`),
                fetchFontAsDataUrl(`${origin}/fonts/NotoSans-Bold.woff`),
                fetchFontAsDataUrl(`${origin}/fonts/NotoSans-Italic.woff`),
            ]);
            registerFonts({ regular, bold, italic });

            // 4. PDF blob'u oluştur
            const blob = await pdf(<ReceiptPDF data={result.data} />).toBlob();

            // 5. Yeni sekmede aç
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');

        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : 'Bilinmeyen hata';
            setError('PDF oluşturulurken bir hata oluştu.');
            console.error('[ReceiptDownload]', errMsg);
        } finally {
            setIsLoading(false);
        }
    };


    if (variant === 'icon') {
        return (
            <div>
                <button
                    onClick={handleOpen}
                    disabled={isLoading}
                    title="Makbuz Görüntüle"
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    {isLoading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <FileText className="w-4 h-4" />
                    }
                </button>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
        );
    }

    return (
        <div className="w-full">
            <button
                onClick={handleOpen}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
                {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> PDF Oluşturuluyor...</>
                    : <><FileText className="w-4 h-4" /> Makbuzu Görüntüle</>
                }
            </button>
            {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
        </div>
    );
}
