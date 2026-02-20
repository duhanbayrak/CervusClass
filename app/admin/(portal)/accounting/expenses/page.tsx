import { getTransactions, getCategories } from '@/lib/actions/accounting';
import { getFinanceAccounts } from '@/lib/actions/finance-accounts';
import { TransactionsContent } from '@/components/accounting/transactions/TransactionsContent';

/**
 * Gider Yönetimi Sayfası
 */
export default async function ExpensesPage() {
    const [transactions, categories, accounts] = await Promise.all([
        getTransactions({ type: 'expense' }),
        getCategories('expense'),
        getFinanceAccounts(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Gider Yönetimi</h2>
                <p className="text-muted-foreground">
                    Kurum giderlerinizi kaydedin ve takip edin.
                </p>
            </div>
            <TransactionsContent
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                type="expense"
            />
        </div>
    );
}
