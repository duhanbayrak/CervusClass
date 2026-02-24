import { getFinanceServices } from '@/lib/actions/finance-services';
import { getFinanceSettings } from '@/lib/actions/finance-settings';
import ServiceList from '@/components/accounting/services/ServiceList';

export const metadata = {
    title: 'Hizmetler & Ürünler — Cervus Class',
};

export default async function ServicesPage() {
    // Paralel veri çekme
    const [services, settings] = await Promise.all([
        getFinanceServices(),
        getFinanceSettings(),
    ]);

    const currency = settings?.currency || 'TRY';

    return <ServiceList services={services} currency={currency} />;
}
