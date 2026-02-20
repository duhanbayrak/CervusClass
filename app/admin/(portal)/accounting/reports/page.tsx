import ReportsContent from '@/components/accounting/reports/ReportsContent';
import { getFinanceCategories } from '@/lib/actions/accounting';

export const metadata = {
    title: 'Raporlama — Cervus Class',
};

export default async function AccountingReportsPage() {
    // Filtre seçenekleri için kategori listesini çek
    const categories = await getFinanceCategories();

    return <ReportsContent categories={categories} />;
}
