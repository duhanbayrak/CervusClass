import { getStudentFees, getStudentFeeDetail } from '@/lib/actions/student-fees';
import { getFeePayments } from '@/lib/actions/fee-payments';
import { getFinanceSettings } from '@/lib/actions/finance-settings';
import { StudentFeeDetail } from '@/components/accounting/students/StudentFeeDetail';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

/**
 * Öğrenci Ücret Detay Sayfası
 * Ücret bilgileri, taksit planı ve ödeme geçmişi
 */
export default async function StudentFeeDetailPage({ params }: Props) {
    const { id: studentId } = await params;

    // Öğrenciye ait tüm ücret sepetlerini getir
    const studentFees = await getStudentFees({ student_id: studentId });

    if (!studentFees || studentFees.length === 0) {
        notFound();
    }

    // Her bir sepet için detaylı bilgileri (taksitleri vb.) getir
    const feesDetails = await Promise.all(
        studentFees.map(fee => getStudentFeeDetail(fee.id))
    );

    // Tüm taksitleri düz bir dizide topla
    const allInstallments = feesDetails.flatMap(detail => detail.installments);

    // Ayarları ve öğrencinin tüm ödemelerini getir
    const [paymentsResult, settings] = await Promise.all([
        getFeePayments({ student_id: studentId }),
        getFinanceSettings(),
    ]);

    // fees propsuna fee nesnelerini gönder
    return (
        <div className="space-y-6">
            <StudentFeeDetail
                fees={feesDetails.map(d => d.fee).filter(Boolean)}
                installments={allInstallments}
                payments={paymentsResult.data}
                currency={settings?.currency || 'TRY'}
                studentId={studentId}
            />
        </div>
    );
}
