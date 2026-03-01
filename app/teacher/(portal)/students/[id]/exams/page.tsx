import { StudentExamsHistoryPage } from '@/components/exams/StudentExamsHistoryPage'

export default async function TeacherStudentExamsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    return <StudentExamsHistoryPage studentId={id} role="teacher" />
}
