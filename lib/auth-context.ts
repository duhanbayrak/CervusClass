'use server'

import { createClient } from '@/lib/supabase-server'

/**
 * Merkezi auth context helper.
 * Tüm server action'larda tekrarlanan adımları tek yerde toplar:
 * 1. Supabase server client oluştur
 * 2. auth.getUser() ile kullanıcı bilgisini al (güvenli)
 * 3. organization_id'yi JWT app_metadata'dan al (DB sorgusu gerektirmez)
 */
export async function getAuthContext() {
    const supabase = await createClient()

    // getUser() Supabase Auth API'ye doğrulama isteği yapar — güvenli
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { supabase, user: null, organizationId: null, error: 'Oturum bulunamadı.' }
    }

    // Organization ID'yi JWT app_metadata'dan al (DB sorgusu yok, daha hızlı)
    const organizationId = user.app_metadata?.organization_id || null

    if (!organizationId) {
        return { supabase, user, organizationId: null, error: 'Kurum bilgisi bulunamadı.' }
    }

    return { supabase, user, organizationId, error: null }
}
