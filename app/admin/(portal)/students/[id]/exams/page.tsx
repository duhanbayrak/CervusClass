import { StudentExamsHistoryPage } from '@/components/exams/StudentExamsHistoryPage'

export default async function AdminStudentExamsPage({ // NOSONAR
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    return <StudentExamsHistoryPage studentId={id} role="admin" />
}
