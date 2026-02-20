import { getStudentFees } from '@/lib/actions/student-fees';
import { getFinanceSettings } from '@/lib/actions/finance-settings';
import { StudentFeeList } from '@/components/accounting/students/StudentFeeList';

/**
 * Öğrenci Ücret Yönetimi — Liste sayfası
 * Tüm öğrencilerin ücret kayıtlarını gösterir, filtre ve arama destekli
 */
export default async function AccountingStudentsPage() {
    const [fees, settings] = await Promise.all([
        getStudentFees(),
        getFinanceSettings(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Öğrenci Ücret Yönetimi</h2>
                <p className="text-muted-foreground">
                    Öğrenci ücretlerini, taksitleri ve ödemeleri buradan yönetin.
                </p>
            </div>
            <StudentFeeList
                fees={fees}
                currency={settings?.currency || 'TRY'}
            />
        </div>
    );
}
