import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * "Öğrenci Ücreti" kategorisini getirir, yoksa oluşturur.
 * T3 Düzeltmesi: Concurrency / Race Condition hatasını önlemek için atomik UPSERT (on conflict) eklendi.
 * Veritabanında (organization_id, name, type) alanlarına "unique" constraint olduğu varsayılarak yazılır.
 */
export async function getOrCreateStudentFeeCategory(
    supabase: SupabaseClient,
    organizationId: string
): Promise<string | null> {
    // T3: Atomik UPSERT İşlemi.
    // Başka bir paralel istek tam bu saniyede aynısını yazmaya çalışırsa,
    // Veritabanı "on conflict" sayesinde çökmek yerine ID'yi geri döndürecektir.
    const { data: category, error } = await supabase
        .from('finance_categories')
        .upsert(
            {
                organization_id: organizationId,
                name: 'Öğrenci Ücreti',
                type: 'income',
                icon: '🎓',
            },
            {
                onConflict: 'organization_id,name,type',
                ignoreDuplicates: false // Varsa da dönmesi için update tetiklenir veya veritabanı rule'larına uygun davranır.
            }
        )
        .select('id')
        .single();

    // Eğer Upsert işlemi (Unique index yokluğundan) hata veriyorsa fail-safe olarak basit SELECT fallback yapılabilir:
    if (error) {
        // Log the error but try fallback just in case the unique constraint isn't exactly matches onConflict fields above
        const { data: existing } = await supabase
            .from('finance_categories')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('name', 'Öğrenci Ücreti')
            .eq('type', 'income')
            .maybeSingle();

        return existing?.id ?? null;
    }

    return category?.id ?? null;
}

/**
 * Toplam tutarı verilen taksit sayısına böler,
 * küsurat (yuvarlama) farkını son taksite yansıtarak taksit tutarları dizisi döner.
 */
export function calcInstallmentAmounts(totalAmount: number, installmentCount: number): number[] {
    if (installmentCount <= 0) return [];
    if (installmentCount === 1) return [Math.round(totalAmount * 100) / 100];

    const amountPerInstallment = Math.round((totalAmount / installmentCount) * 100) / 100;
    const baseAmounts = new Array(installmentCount - 1).fill(amountPerInstallment);
    const sumOfBase = amountPerInstallment * (installmentCount - 1);

    // Son taksit tutarı: (Toplam - önceki_taksitlerin_toplamı)
    const lastAmount = Math.round((totalAmount - sumOfBase) * 100) / 100;

    return [...baseAmounts, lastAmount];
}
