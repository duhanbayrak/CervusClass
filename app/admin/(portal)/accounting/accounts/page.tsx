import { getFinanceAccounts } from '@/lib/actions/finance-accounts';
import { AccountsContent } from '@/components/accounting/accounts/AccountsContent';

/**
 * Kasa & Banka Hesapları Sayfası
 * Hesapları listeleme, ekleme ve yönetim
 */
export default async function AccountingAccountsPage() {
    const accounts = await getFinanceAccounts();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Kasa & Banka Hesapları</h2>
                <p className="text-muted-foreground">
                    Nakit, banka ve POS hesaplarınızı buradan yönetin.
                </p>
            </div>
            <AccountsContent accounts={accounts} />
        </div>
    );
}
