'use server';

import { getAuthContext } from '@/lib/auth-context';
import type { FinanceSettings, AcademicPeriod } from '@/types/accounting';

/**
 * Muhasebe ayarlarını getirir.
 * Eğer henüz oluşturulmamışsa, varsayılan ayarları oluşturur.
 */
export async function getFinanceSettings(): Promise<FinanceSettings | null> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return null;

    // Mevcut ayarları sorgula
    const { data, error: fetchError } = await supabase
        .from('finance_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

    if (fetchError?.code === 'PGRST116') {
        // Kayıt yok — varsayılan oluştur
        const { data: newSettings, error: insertError } = await supabase
            .from('finance_settings')
            .insert({
                organization_id: organizationId,
                currency: 'TRY',
                default_installments: 1,
                payment_due_day: 1,
                academic_periods: [],
            })
            .select()
            .single();

        if (insertError) return null;
        return newSettings as unknown as FinanceSettings;
    }

    if (fetchError) return null;
    return data as unknown as FinanceSettings;
}

/**
 * Muhasebe ayarlarını günceller.
 */
export async function updateFinanceSettings(settings: {
    currency?: string;
    default_installments?: number;
    payment_due_day?: number;
    academic_periods?: AcademicPeriod[];
}): Promise<{ success: boolean; error?: string }> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || 'Yetkilendirme hatası' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase Json ↔ AcademicPeriod[] uyumsuzluğu
    const { error: updateError } = await supabase
        .from('finance_settings')
        .update({
            ...settings,
            updated_at: new Date().toISOString(),
        } as any)
        .eq('organization_id', organizationId);

    if (updateError) return { success: false, error: updateError.message };
    return { success: true };
}
