import { StudentExamDetailPage } from '@/components/exams/StudentExamDetailPage'

export default async function AdminStudentExamDetailPage({ // NOSONAR
    params,
}: Readonly<{
    params: Promise<{ examName: string; studentId: string }>
}>) {
    const { examName, studentId } = await params
    return <StudentExamDetailPage examName={examName} studentId={studentId} role="admin" />
}
