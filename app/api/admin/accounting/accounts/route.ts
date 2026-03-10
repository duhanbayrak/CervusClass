import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { getFinanceAccounts } from '@/lib/actions/finance-accounts';

/**
 * Finans hesapları listesini döndürür.
 * PaymentRecordDialog ve TransactionForm tarafından kullanılır.
 */
export async function GET() {
    try {
        const accounts = await getFinanceAccounts();
        return NextResponse.json({ accounts });
    } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e))
        Sentry.withScope((scope) => {
            scope.setTag('route', 'admin:accounting_accounts')
            scope.setLevel('error')
            Sentry.captureException(err)
        })
        console.error('[API Error] accounting/accounts:', err)
        return NextResponse.json({ error: 'Hesaplar alınamadı.' }, { status: 500 });
    }
}
