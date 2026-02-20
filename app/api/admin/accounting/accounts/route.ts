import { NextResponse } from 'next/server';
import { getFinanceAccounts } from '@/lib/actions/finance-accounts';

/**
 * Finans hesapları listesini döndürür.
 * PaymentRecordDialog ve TransactionForm tarafından kullanılır.
 */
export async function GET() {
    const accounts = await getFinanceAccounts();
    return NextResponse.json({ accounts });
}
