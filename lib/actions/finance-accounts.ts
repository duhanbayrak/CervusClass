'use server';

import { getAuthContext } from '@/lib/auth-context';
import type { FinanceAccount } from '@/types/accounting';

/**
 * Tüm hesapları getirir.
 */
export async function getFinanceAccounts(): Promise<FinanceAccount[]> {
    const { supabase, error } = await getAuthContext();
    if (error) return [];

    const { data, error: fetchError } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('is_active', true) // Pasif hesaplar gösterilmez
        .order('created_at', { ascending: true });

    if (fetchError) return [];
    return (data || []) as FinanceAccount[];
}

/**
 * Yeni hesap oluşturur.
 */
export async function createFinanceAccount(account: {
    name: string;
    account_type: 'cash' | 'bank' | 'pos';
    balance?: number;
    initial_balance?: number;
    currency?: string;
}): Promise<{ success: boolean; data?: FinanceAccount; error?: string }> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || 'Yetkilendirme hatası' };

    const { data, error: insertError } = await supabase
        .from('finance_accounts')
        .insert({
            organization_id: organizationId,
            name: account.name,
            account_type: account.account_type,
            balance: account.balance || 0,
            initial_balance: account.initial_balance || 0,
            currency: account.currency || 'TRY',
        })
        .select()
        .single();

    if (insertError) return { success: false, error: insertError.message };
    return { success: true, data: data as FinanceAccount };
}

/**
 * Hesap bilgilerini günceller.
 */
export async function updateFinanceAccount(
    accountId: string,
    updates: {
        name?: string;
        account_type?: 'cash' | 'bank' | 'pos';
        is_active?: boolean;
    }
): Promise<{ success: boolean; error?: string }> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || 'Yetkilendirme hatası' };

    const { error: updateError } = await supabase
        .from('finance_accounts')
        .update(updates)
        .eq('id', accountId)
        .eq('organization_id', organizationId); // Çapraz kurum güvenlik filtresi

    if (updateError) return { success: false, error: updateError.message };
    return { success: true };
}

/**
 * Hesap siler.
 * Hesaba bağlı finansal işlem veya ödeme varsa silme işlemini engeller.
 */
export async function deleteFinanceAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || 'Yetkilendirme hatası' };

    // 1. Bağlı finansal işlem var mı kontrol et
    const { count: txCount, error: txError } = await supabase
        .from('finance_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('organization_id', organizationId);

    if (txError) return { success: false, error: 'Bağlı işlem kontrolü sırasında bir hata oluştu.' };
    if (txCount && txCount > 0) {
        return { success: false, error: 'Bu hesaba bağlı finansal işlemler bulunduğu için hesap silinemez. Bunun yerine hesabı pasif duruma alabilirsiniz.' };
    }

    // 2. Bağlı tahsilat/ödeme var mı kontrol et
    const { count: paymentCount, error: paymentError } = await supabase
        .from('fee_payments')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('organization_id', organizationId);

    if (paymentError) return { success: false, error: 'Bağlı ödeme kontrolü sırasında bir hata oluştu.' };
    if (paymentCount && paymentCount > 0) {
        return { success: false, error: 'Bu hesaba bağlı öğrenci tahsilatları bulunduğu için hesap silinemez. Bunun yerine hesabı pasif duruma alabilirsiniz.' };
    }

    // 3. Bağlı kayıt yoksa, hesabı sil
    const { data: deleted, error: deleteError } = await supabase
        .from('finance_accounts')
        .delete()
        .eq('id', accountId)
        .eq('organization_id', organizationId) // Çapraz kurum güvenlik filtresi
        .select('id');

    if (deleteError) return { success: false, error: deleteError.message };

    // 0 satır silindiyse hesap zaten yok veya farklı kuruma aittir
    if (!deleted || deleted.length === 0) {
        return { success: false, error: 'Hesap bulunamadı veya silme yetkiniz yok.' };
    }

    return { success: true };
}
