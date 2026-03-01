/**
 * Ortam değişkenlerini güvenli bir şekilde almak için yardımcı fonksiyonlar.
 * SonarCloud (S4325) gereksiz tip zorlaması uyarılarını önlemek için tasarlanmıştır.
 */

export function getSupabaseEnv() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }

    if (!anonKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
    }

    return {
        url,
        anonKey,
    };
}
