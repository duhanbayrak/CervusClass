'use client'

import dynamic from 'next/dynamic'

export const DynamicExamOverviewChart = dynamic(() => import('@/components/student/exams/exam-overview-chart').then(mod => mod.ExamOverviewChart), {
    loading: () => <div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-xl" />,
    ssr: false
})

export const DynamicSubjectOverviewCharts = dynamic(() => import('@/components/student/exams/subject-overview-charts').then(mod => mod.SubjectOverviewCharts), {
    loading: () => <div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-xl" />,
    ssr: false
})

export const DynamicStudentExamChart = dynamic(() => import('@/components/student/detail/student-exam-chart').then(mod => mod.StudentExamChart), {
    loading: () => <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-xl" />,
    ssr: false
})

export const DynamicExamDetailCharts = dynamic(() => import('@/components/student/exams/exam-detail-charts').then(mod => mod.ExamDetailCharts), {
    loading: () => <div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-xl" />,
    ssr: false
})
