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
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    const { error: updateError } = await supabase
        .from('finance_accounts')
        .update(updates)
        .eq('id', accountId);

    if (updateError) return { success: false, error: updateError.message };
    return { success: true };
}

/**
 * Hesap siler.
 */
export async function deleteFinanceAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    const { error: deleteError } = await supabase
        .from('finance_accounts')
        .delete()
        .eq('id', accountId);

    if (deleteError) return { success: false, error: deleteError.message };
    return { success: true };
}
