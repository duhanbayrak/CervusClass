'use server';

import { getAuthContext } from '@/lib/auth-context';
import type { FinanceCategory, FinanceTransaction, TransactionType } from '@/types/accounting';
import { getDateRange } from '@/lib/utils/date';

// =============================================
// Kategori İşlemleri
// =============================================

/**
 * Gelir/Gider kategorilerini tipe göre getirir.
 */
export async function getFinanceCategories(type?: 'income' | 'expense'): Promise<FinanceCategory[]> {
    const { supabase, error } = await getAuthContext();
    if (error) return [];

    let query = supabase
        .from('finance_categories')
        .select('*')
        .order('sort_order', { ascending: true });

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error: fetchError } = await query;
    if (fetchError) return [];
    return (data || []) as any; // Type defined in Promise return
}

/**
 * Yeni kategori oluşturur.
 */
export async function createFinanceCategory(category: {
    name: string;
    type: 'income' | 'expense';
    parent_id?: string;
    icon?: string;
}): Promise<{ success: boolean; data?: FinanceCategory; error?: string }> {
    const { supabase, organizationId, error } = await getAuthContext();
    if (error || !organizationId) return { success: false, error: error || 'Yetkilendirme hatası' };

    const { data, error: insertError } = await supabase
        .from('finance_categories')
        .insert({
            organization_id: organizationId,
            name: category.name,
            type: category.type,
            parent_id: category.parent_id || null,
            icon: category.icon || null,
        })
        .select()
        .single();

    if (insertError) return { success: false, error: insertError.message };
    return { success: true, data: data as any };
}

/**
 * Kategoriyi günceller.
 */
export async function updateFinanceCategory(
    categoryId: string,
    updates: { name?: string; icon?: string; sort_order?: number }
): Promise<{ success: boolean; error?: string }> {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    const { error: updateError } = await supabase
        .from('finance_categories')
        .update(updates)
        .eq('id', categoryId);

    if (updateError) return { success: false, error: updateError.message };
    return { success: true };
}

/**
 * Kategoriyi siler (sistem kategorileri silinemez).
 */
export async function deleteFinanceCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    // Önce sistem kategorisi mi kontrol et
    const { data: category } = await supabase
        .from('finance_categories')
        .select('is_system')
        .eq('id', categoryId)
        .single();

    if (category?.is_system) {
        return { success: false, error: 'Sistem kategorileri silinemez.' };
    }

    const { error: deleteError } = await supabase
        .from('finance_categories')
        .delete()
        .eq('id', categoryId);

    if (deleteError) return { success: false, error: deleteError.message };
    return { success: true };
}

// =============================================
// Gelir/Gider İşlemleri
// =============================================

/**
 * İşlemleri filtreli getirir.
 */
export async function getFinanceTransactions(filters?: {
    type?: TransactionType;
    category_id?: string;
    account_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
}): Promise<{ data: FinanceTransaction[]; count: number }> {
    const { supabase, error } = await getAuthContext();
    if (error) return { data: [], count: 0 };

    let query = supabase
        .from('finance_transactions')
        .select(`
            *,
            account:finance_accounts!account_id(name),
            category:finance_categories!category_id(name, type, icon),
            created_by_profile:profiles!created_by(full_name)
        `, { count: 'exact' })
        .is('deleted_at', null)
        .order('transaction_date', { ascending: false });

    // Filtreler
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.category_id) query = query.eq('category_id', filters.category_id);
    if (filters?.account_id) query = query.eq('account_id', filters.account_id);
    if (filters?.start_date) query = query.gte('transaction_date', filters.start_date);
    if (filters?.end_date) query = query.lte('transaction_date', filters.end_date);

    // Sayfalama
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error: fetchError } = await query;
    if (fetchError) return { data: [], count: 0 };
    return { data: (data || []) as any, count: count || 0 };
}

/**
 * Yeni gelir/gider işlemi oluşturur ve hesap bakiyesini günceller.
 */
export async function createFinanceTransaction(transaction: {
    account_id: string;
    category_id: string;
    type: TransactionType;
    amount: number;
    subtotal?: number;
    vat_rate?: number;
    vat_amount?: number;
    service_id?: string;
    description: string;
    transaction_date: string;
    reference_no?: string;
    related_payment_id?: string;
    is_recurring?: boolean;
    recurring_period?: 'monthly' | 'quarterly' | 'yearly';
}): Promise<{ success: boolean; error?: string }> {
    const { supabase, organizationId, user, error } = await getAuthContext();
    if (error || !organizationId || !user) return { success: false, error: error || 'Yetkilendirme hatası' };

    // 1. İşlemi oluştur (KDV alanları dahil)
    const { error: insertError } = await supabase
        .from('finance_transactions')
        .insert({
            organization_id: organizationId,
            account_id: transaction.account_id,
            category_id: transaction.category_id,
            type: transaction.type,
            amount: transaction.amount,
            subtotal: transaction.subtotal ?? transaction.amount,
            vat_rate: transaction.vat_rate ?? 0,
            vat_amount: transaction.vat_amount ?? 0,
            service_id: transaction.service_id || null,
            description: transaction.description,
            transaction_date: transaction.transaction_date,
            reference_no: transaction.reference_no || null,
            related_payment_id: transaction.related_payment_id || null,
            is_recurring: transaction.is_recurring || false,
            recurring_period: transaction.recurring_period || null,
            created_by: user.id,
        });

    if (insertError) return { success: false, error: insertError.message };

    // 2. Hesap bakiyesini güncelleme işlemi DB Trigger (fn_update_account_balance_on_transaction) tarafından otomatik yapılır.

    return { success: true };
}

/**
 * İşlemi soft delete yapar.
 */
export async function deleteFinanceTransaction(transactionId: string): Promise<{ success: boolean; error?: string }> {
    const { supabase, error } = await getAuthContext();
    if (error) return { success: false, error };

    const { error: updateError } = await supabase
        .from('finance_transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', transactionId);

    if (updateError) return { success: false, error: updateError.message };
    return { success: true };
}

// =============================================
// Kısa isim alias'ları — sayfa ve bileşenlerde kullanılır
// =============================================

/** getFinanceCategories alias */
export const getCategories = getFinanceCategories;

/** getFinanceTransactions wrapper — sadece data döndürür */
export async function getTransactions(filters?: {
    type?: TransactionType;
    category_id?: string;
    account_id?: string;
    start_date?: string;
    end_date?: string;
}): Promise<FinanceTransaction[]> {
    const result = await getFinanceTransactions(filters);
    return result.data;
}

/** createFinanceTransaction alias */
export const createTransaction = createFinanceTransaction;

/**
 * Dashboard için son N işlemi getirir.
 */
export async function getRecentTransactions(limit = 10, period: string = 'yearly'): Promise<FinanceTransaction[]> {
    const { startDate, endDate } = getDateRange(period);
    const result = await getFinanceTransactions({ limit, start_date: startDate, end_date: endDate });
    return result.data;
}
