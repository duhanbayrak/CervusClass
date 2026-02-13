'use server'

import { createClient } from '@/lib/supabase-server'

/**
 * Merkezi auth context helper.
 * Tüm server action'larda tekrarlanan 3 adımı tek yerde toplar:
 * 1. Supabase server client oluştur
 * 2. auth.getSession() ile kullanıcı bilgisini al (HTTP isteği yok, JWT decode)
 * 3. organization_id'yi profiles tablosundan al
 *
 * Performans: getUser() yerine getSession() → ~200ms tasarruf / action çağrısı
 */
export async function getAuthContext() {
    const supabase = await createClient()

    // getUser() Supabase Auth API'ye doğrulama isteği yapar — güvenli
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { supabase, user: null, organizationId: null, error: 'Oturum bulunamadı.' }
    }

    // Organization ID'yi profiles tablosundan al
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) {
        return { supabase, user, organizationId: null, error: 'Kurum bilgisi bulunamadı.' }
    }

    return { supabase, user, organizationId: profile.organization_id, error: null }
}
