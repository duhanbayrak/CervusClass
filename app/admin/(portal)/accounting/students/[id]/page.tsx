import { getStudentFeeDetail } from '@/lib/actions/student-fees';
import { getFeePayments } from '@/lib/actions/fee-payments';
import { getFinanceSettings } from '@/lib/actions/finance-settings';
import { StudentFeeDetail } from '@/components/accounting/students/StudentFeeDetail';

interface Props {
    params: Promise<{ id: string }>;
}

/**
 * Öğrenci Ücret Detay Sayfası
 * Ücret bilgileri, taksit planı ve ödeme geçmişi
 */
export default async function StudentFeeDetailPage({ params }: Props) {
    const { id } = await params;
    const [feeDetail, paymentsResult, settings] = await Promise.all([
        getStudentFeeDetail(id),
        getFeePayments({ student_id: id }),
        getFinanceSettings(),
    ]);

    return (
        <div className="space-y-6">
            <StudentFeeDetail
                fee={feeDetail.fee}
                installments={feeDetail.installments}
                payments={paymentsResult.data}
                currency={settings?.currency || 'TRY'}
            />
        </div>
    );
}
