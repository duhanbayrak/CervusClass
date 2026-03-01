import { ClassExamResultsPage } from '@/components/exams/ClassExamResultsPage'

export default async function TeacherClassExamDetailPage({
    params,
}: {
    params: Promise<{ examName: string; classId: string }>
}) {
    const { examName, classId } = await params
    return <ClassExamResultsPage examName={examName} classId={classId} role="teacher" />
}
