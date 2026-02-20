import { getTransactions, getCategories } from '@/lib/actions/accounting';
import { getFinanceAccounts } from '@/lib/actions/finance-accounts';
import { TransactionsContent } from '@/components/accounting/transactions/TransactionsContent';

/**
 * Gelir Yönetimi Sayfası
 */
export default async function IncomePage() {
    const [transactions, categories, accounts] = await Promise.all([
        getTransactions({ type: 'income' }),
        getCategories('income'),
        getFinanceAccounts(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Gelir Yönetimi</h2>
                <p className="text-muted-foreground">
                    Kurum gelirlerinizi kaydedin ve takip edin.
                </p>
            </div>
            <TransactionsContent
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                type="income"
            />
        </div>
    );
}
