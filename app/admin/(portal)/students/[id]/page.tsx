import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { StudentDetailView } from '@/components/student/student-detail-view';
import { getStudentProfileData } from '@/lib/data/student-profile';
import { getStudentFees, getStudentFeeDetail } from '@/lib/actions/student-fees';
import { getFeePayments } from '@/lib/actions/fee-payments';

export default async function StudentDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    );

    const data = await getStudentProfileData(supabase, id);

    if (!data) {
        notFound();
    }

    // Finansal Verilerin Çekilmesi
    const fees = await getStudentFees({ student_id: id });
    const latestFee = fees.length > 0 ? fees[0] : null;

    let installments: any[] = [];
    if (latestFee) {
        const detail = await getStudentFeeDetail(latestFee.id);
        installments = detail.installments;
    }

    const { data: payments } = await getFeePayments({ student_id: id });

    const financialData = {
        fee: latestFee,
        installments: installments,
        payments: payments
    };

    return (
        <div className="p-8">
            <StudentDetailView
                profile={data.profile}
                examResults={data.examResults}
                stats={data.stats}
                role="admin"
                financialData={financialData}
            />
        </div>
    );
}
