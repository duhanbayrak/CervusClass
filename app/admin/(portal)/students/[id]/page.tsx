import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { StudentDetailView } from '@/components/student/student-detail-view';
import { getStudentProfileData } from '@/lib/data/student-profile';
import { getStudentFees, getStudentFeeDetail } from '@/lib/actions/student-fees';
import { getFeePayments } from '@/lib/actions/fee-payments';

export default async function StudentDetailPage(props: Readonly<{ params: Promise<{ id: string }> }>) { // NOSONAR
    const params = await props.params;
    const { id } = params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, // NOSONAR
        (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string), // NOSONAR
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

    // Finansal Verilerin Çekilmesi (Çoklu Hizmet Desteği)
    const fees = await getStudentFees({ student_id: id });
    const installments: any[] = [];

    // Tüm ücret kalemleri için taksitleri topla
    for (const fee of fees) {
        const detail = await getStudentFeeDetail(fee.id);
        installments.push(...detail.installments);
    }

    const { data: payments } = await getFeePayments({ student_id: id });

    const financialData = {
        fees: fees, // Birden fazla fee objesini besliyoruz
        installments: installments,
        payments: payments
    };

    return (
        <div className="p-8">
            <StudentDetailView
                profile={data.profile}
                examResults={data.examResults}
                stats={data.stats}
                notes={data.notes}
                role="admin"
                financialData={financialData}
            />
        </div>
    );
}
