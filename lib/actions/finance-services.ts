'use server';

import { revalidateTag, unstable_cache } from 'next/cache';
import { getAuthContext } from '@/lib/auth-context';
import { createClient } from '@supabase/supabase-js';
import type { FinanceService, CategoryType } from '@/types/accounting';

/**
 * Hizmet/ürün listesini getiren cache'li iç fonksiyon.
 * organization_id ve filtreler cache key'inin parçasıdır.
 */
const getCachedFinanceServices = unstable_cache(
    async (
        organizationId: string,
        type?: CategoryType,
        is_active?: boolean
    ): Promise<FinanceService[]> => {
        // Cache içinde auth context kullanamıyoruz — service role client kullanıyoruz
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
            process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
        );

        let query = supabase
            .from('finance_services')
            .select(`
                *,
                category:finance_categories!category_id(name, icon)
            `)
            .eq('organization_id', organizationId)
            .order('name');

        if (type) query = query.eq('type', type);
        if (is_active !== undefined) query = query.eq('is_active', is_active);

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as FinanceService[];
    },
    ['finance-services-list'],
    {
        tags: ['finance-services'],
        revalidate: 300, // 5 dakika — hizmetler nadiren değişir
    }
);

/**
 * Hizmet/ürün listesini getirir.
 * Opsiyonel filtreler: tip (gelir/gider), aktiflik durumu
 */
export async function getFinanceServices(filters?: {
    type?: CategoryType;
    is_active?: boolean;
}): Promise<FinanceService[]> {
    const { organizationId, error } = await getAuthContext();
    if (error || !organizationId) return [];

    try {
        return await getCachedFinanceServices(
            organizationId,
            filters?.type,
            filters?.is_active
        );
    } catch {
        return [];
    }
}

/**
 * Tek bir hizmet/ürünü getirir.
 */
export async function getFinanceService(id: string): Promise<FinanceService | null> {
    const { supabase, error } = await getAuthContext();
    if (error) return null;

    const { data } = await supabase
        .from('finance_services')
        .select(`
            *,
            category:finance_categories!category_id(name, icon)
        `)
        .eq('id', id)
        .single();

    return (data as FinanceService) || null;
}

/**
 * Yeni hizmet/ürün oluşturur.
 * organization_id otomatik eklenir (JWT'den).
 */
export async function createFinanceService(data: {
    name: string;
    type: CategoryType;
    category_id?: string;
    unit_price: number;
    vat_rate: number;
    description?: string;
}): Promise<{ success: boolean; data?: FinanceService; error?: string }> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || 'Yetkilendirme hatası' };

    // KDV oranı doğrulama
    if (data.vat_rate < 0 || data.vat_rate > 100) {
        return { success: false, error: 'KDV oranı 0-100 arasında olmalıdır.' };
    }

    // Birim fiyat doğrulama
    if (data.unit_price < 0) {
        return { success: false, error: 'Birim fiyat negatif olamaz.' };
    }

    const { data: inserted, error: insertError } = await supabase
        .from('finance_services')
        .insert({
            organization_id: organizationId,
            name: data.name.trim(),
            type: data.type,
            category_id: data.category_id || null,
            unit_price: data.unit_price,
            vat_rate: data.vat_rate,
            description: data.description?.trim() || null,
        })
        .select(`
            *,
            category:finance_categories!category_id(name, icon)
        `)
        .single();

    if (insertError) return { success: false, error: insertError.message };
    // Yeni hizmet eklendi — listeyi geçersiz kıl
    // @ts-ignore
    revalidateTag('finance-services');
    return { success: true, data: inserted as FinanceService };
}

/**
 * Hizmet/ürün günceller.
 */
export async function updateFinanceService(
    id: string,
    updates: {
        name?: string;
        type?: CategoryType;
        category_id?: string | null;
        unit_price?: number;
        vat_rate?: number;
        is_active?: boolean;
        description?: string | null;
    }
): Promise<{ success: boolean; error?: string }> {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    // KDV oranı doğrulama
    if (updates.vat_rate !== undefined && (updates.vat_rate < 0 || updates.vat_rate > 100)) {
        return { success: false, error: 'KDV oranı 0-100 arasında olmalıdır.' };
    }

    // Birim fiyat doğrulama
    if (updates.unit_price !== undefined && updates.unit_price < 0) {
        return { success: false, error: 'Birim fiyat negatif olamaz.' };
    }

    // İsim trim
    const cleanUpdates = {
        ...updates,
        name: updates.name?.trim(),
        description: updates.description?.trim() || null,
        updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
        .from('finance_services')
        .update(cleanUpdates)
        .eq('id', id);

    if (updateError) return { success: false, error: updateError.message };
    // Güncelleme oldu — listeyi geçersiz kıl
    // @ts-ignore
    revalidateTag('finance-services');
    return { success: true };
}

/**
 * Hizmet/ürün siler.
 * Bağlı işlemler varsa silme reddedilir — bunun yerine pasif yapılması önerilir.
 */
export async function deleteFinanceService(id: string): Promise<{ success: boolean; error?: string }> {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    // Bağlı işlem kontrolü — varsa silme reddet
    const { count: txCount } = await supabase
        .from('finance_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('service_id', id);

    const { count: feeCount } = await supabase
        .from('student_fees')
        .select('id', { count: 'exact', head: true })
        .eq('service_id', id);

    if ((txCount || 0) > 0 || (feeCount || 0) > 0) {
        return {
            success: false,
            error: 'Bu hizmete bağlı işlem veya ücret kaydı bulunduğundan silinemez. Bunun yerine pasif yapabilirsiniz.',
        };
    }

    const { error: deleteError } = await supabase
        .from('finance_services')
        .delete()
        .eq('id', id);

    if (deleteError) return { success: false, error: deleteError.message };
    // Silindi — listeyi geçersiz kıl
    // @ts-ignore
    revalidateTag('finance-services');
    return { success: true };
}
