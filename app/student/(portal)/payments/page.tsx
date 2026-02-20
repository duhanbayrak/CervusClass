import { getMyFees } from '@/lib/actions/student-payments';
import MyPaymentsContent from '@/components/student/payments/MyPaymentsContent';

export const metadata = {
    title: 'Ödeme Durumum — Cervus Class',
};

export default async function StudentPaymentsPage() {
    const fees = await getMyFees();

    return <MyPaymentsContent fees={fees} />;
}
