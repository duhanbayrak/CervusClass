import { StudentExamsHistoryPage } from '@/components/exams/StudentExamsHistoryPage'

export default async function TeacherStudentExamsPage({ // NOSONAR
    params,
}: Readonly<{
    params: Promise<{ id: string }>
}>) {
    const { id } = await params
    return <StudentExamsHistoryPage studentId={id} role="teacher" />
}
