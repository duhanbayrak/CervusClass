import { getFinanceSettings } from '@/lib/actions/finance-settings';
import { getFinanceCategories } from '@/lib/actions/accounting';
import { SettingsContent } from '@/components/accounting/settings/SettingsContent';

/**
 * Muhasebe Ayarları Sayfası
 * Genel ayarlar, kategori yönetimi ve akademik dönem yönetimi
 */
export default async function AccountingSettingsPage() {
    // Server Component — veriler sunucuda çekilir
    const [settings, incomeCategories, expenseCategories] = await Promise.all([
        getFinanceSettings(),
        getFinanceCategories('income'),
        getFinanceCategories('expense'),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Muhasebe Ayarları</h2>
                <p className="text-muted-foreground">
                    Para birimi, taksit ve kategori ayarlarını buradan yönetin.
                </p>
            </div>
            <SettingsContent
                settings={settings}
                incomeCategories={incomeCategories}
                expenseCategories={expenseCategories}
            />
        </div>
    );
}
