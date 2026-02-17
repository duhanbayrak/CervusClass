export function handleError(e: unknown): string {
    console.error('Detailed Action Error:', e);

    if (e instanceof Error) return e.message;

    // String hataları yakala (throw "Hata mesajı")
    if (typeof e === 'string') return e;

    // Nesne tabanlı hatalar
    if (typeof e === 'object' && e !== null) {
        // Supabase veya benzeri { message: '...' } dönen hatalar
        if ('message' in e) {
            return String((e as { message: unknown }).message);
        }
        // { error: '...' } dönen hatalar
        if ('error' in e) {
            return String((e as { error: unknown }).error);
        }

        // Hiçbiri değilse, JSON stringify dene (Dev ortamında faydalı)
        try {
            return JSON.stringify(e);
        } catch {
            return 'Nesne hatası (Stringify başarısız)';
        }
    }

    return `Bilinmeyen hata tipi: ${typeof e}`;
}
