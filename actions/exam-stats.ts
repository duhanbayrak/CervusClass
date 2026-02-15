'use server'

import { createClient } from '@/lib/supabase-server'

// Öğrencinin tüm sınavları + sınıf ortalaması + okul ortalaması
export async function getExamOverviewData(studentId?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const targetStudentId = studentId || user.id

    // 1. Öğrenci profili (class_id ve organization_id)
    const { data: profile } = await supabase
        .from('profiles')
        .select('class_id, organization_id')
        .eq('id', targetStudentId)
        .single()

    if (!profile) return null

    // 2. Öğrencinin kendi sınavları
    const { data: studentExams } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', targetStudentId)
        .order('exam_date', { ascending: false })
        .order('created_at', { ascending: false })

    if (!studentExams || studentExams.length === 0) return { studentExams: [], classAverages: [], schoolAverages: [] }

    // 3. Sınıf ortalaması: aynı class_id'deki öğrencilerin sınavları
    let classAverages: { exam_name: string; exam_date: string; avg_net: number }[] = []
    // Ders bazlı sınıf ortalamaları: { exam_name_date -> { subject -> avg_net } }
    let classSubjectOverview: { exam_name: string; exam_date: string; subjects: Record<string, number> }[] = []

    if (profile.class_id) {
        const { data: classmates } = await supabase
            .from('profiles')
            .select('id')
            .eq('class_id', profile.class_id)
            .eq('organization_id', profile.organization_id)

        if (classmates && classmates.length > 0) {
            const classmateIds = classmates.map(c => c.id)

            const { data: classExams } = await supabase
                .from('exam_results')
                .select('exam_name, exam_date, total_net, scores')
                .in('student_id', classmateIds)
                .order('exam_date', { ascending: true })

            if (classExams) {
                const grouped: Record<string, { total: number; count: number; exam_date: string; exam_name: string; subjectTotals: Record<string, { total: number; count: number }> }> = {}
                classExams.forEach(e => {
                    const key = `${e.exam_name}_${e.exam_date}`
                    if (!grouped[key]) {
                        grouped[key] = { total: 0, count: 0, exam_date: e.exam_date || '', exam_name: e.exam_name, subjectTotals: {} }
                    }
                    grouped[key].total += e.total_net || 0
                    grouped[key].count += 1

                    // Ders bazlı
                    let scores = e.scores
                    if (typeof scores === 'string') { try { scores = JSON.parse(scores) } catch { scores = null } }
                    if (scores && typeof scores === 'object') {
                        Object.entries(scores as Record<string, any>).forEach(([subject, data]) => {
                            const net = typeof data === 'number' ? data : (data?.net ?? 0)
                            if (!grouped[key].subjectTotals[subject]) grouped[key].subjectTotals[subject] = { total: 0, count: 0 }
                            grouped[key].subjectTotals[subject].total += net
                            grouped[key].subjectTotals[subject].count += 1
                        })
                    }
                })
                classAverages = Object.values(grouped).map(g => ({
                    exam_name: g.exam_name,
                    exam_date: g.exam_date,
                    avg_net: Math.round((g.total / g.count) * 100) / 100
                }))
                classSubjectOverview = Object.values(grouped).map(g => {
                    const subjects: Record<string, number> = {}
                    Object.entries(g.subjectTotals).forEach(([s, v]) => {
                        subjects[s] = Math.round((v.total / v.count) * 100) / 100
                    })
                    return { exam_name: g.exam_name, exam_date: g.exam_date, subjects }
                })
            }
        }
    }

    // 4. Okul ortalaması: aynı organization_id'deki tüm öğrencilerin sınavları
    const { data: schoolExams } = await supabase
        .from('exam_results')
        .select('exam_name, exam_date, total_net, scores')
        .eq('organization_id', profile.organization_id)
        .order('exam_date', { ascending: true })

    let schoolAverages: { exam_name: string; exam_date: string; avg_net: number }[] = []
    let schoolSubjectOverview: { exam_name: string; exam_date: string; subjects: Record<string, number> }[] = []

    if (schoolExams) {
        const grouped: Record<string, { total: number; count: number; exam_date: string; exam_name: string; subjectTotals: Record<string, { total: number; count: number }> }> = {}
        schoolExams.forEach(e => {
            const key = `${e.exam_name}_${e.exam_date}`
            if (!grouped[key]) {
                grouped[key] = { total: 0, count: 0, exam_date: e.exam_date || '', exam_name: e.exam_name, subjectTotals: {} }
            }
            grouped[key].total += e.total_net || 0
            grouped[key].count += 1

            let scores = e.scores
            if (typeof scores === 'string') { try { scores = JSON.parse(scores) } catch { scores = null } }
            if (scores && typeof scores === 'object') {
                Object.entries(scores as Record<string, any>).forEach(([subject, data]) => {
                    const net = typeof data === 'number' ? data : (data?.net ?? 0)
                    if (!grouped[key].subjectTotals[subject]) grouped[key].subjectTotals[subject] = { total: 0, count: 0 }
                    grouped[key].subjectTotals[subject].total += net
                    grouped[key].subjectTotals[subject].count += 1
                })
            }
        })
        schoolAverages = Object.values(grouped).map(g => ({
            exam_name: g.exam_name,
            exam_date: g.exam_date,
            avg_net: Math.round((g.total / g.count) * 100) / 100
        }))
        schoolSubjectOverview = Object.values(grouped).map(g => {
            const subjects: Record<string, number> = {}
            Object.entries(g.subjectTotals).forEach(([s, v]) => {
                subjects[s] = Math.round((v.total / v.count) * 100) / 100
            })
            return { exam_name: g.exam_name, exam_date: g.exam_date, subjects }
        })
    }

    return { studentExams, classAverages, schoolAverages, classSubjectOverview, schoolSubjectOverview }
}

// Belirli bir sınav detay bilgileri + sınıf/okul ders bazlı ortalamaları
export async function getExamDetailData(examId: string, studentId?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const targetStudentId = studentId || user.id

    // 1. Profil
    const { data: profile } = await supabase
        .from('profiles')
        .select('class_id, organization_id')
        .eq('id', targetStudentId)
        .single()

    if (!profile) return null

    // 2. Öğrencinin sınavı
    const { data: exam } = await supabase
        .from('exam_results')
        .select('*')
        .eq('id', examId)
        .eq('student_id', targetStudentId)
        .single()

    if (!exam) return null

    // 3. Aynı sınav adındaki sınıf sonuçlarını al (Sıralama ve Ortalama için)
    let classSubjectAverages: Record<string, number> = {}
    let classTotalAvg = 0

    if (profile.class_id) {
        // Sınıf arkadaşlarını getir
        const { data: classmates } = await supabase
            .from('profiles')
            .select('id')
            .eq('class_id', profile.class_id)
            .eq('organization_id', profile.organization_id)

        if (classmates && classmates.length > 0) {
            const classmateIds = classmates.map(c => c.id)

            // Sınıf arkadaşlarının bu sınava ait sonuçlarını çek
            const { data: classExams } = await supabase
                .from('exam_results')
                .select('scores, total_net, student_id')
                .eq('exam_name', exam.exam_name)
                .eq('exam_date', exam.exam_date || '')
                .in('student_id', classmateIds)

            if (classExams && classExams.length > 0) {
                // Sınıf ortalaması
                const totalSum = classExams.reduce((sum, e) => sum + (Number(e.total_net) || 0), 0)
                classTotalAvg = Math.round((totalSum / classExams.length) * 100) / 100

                // Ders bazlı ortalamalar
                const subjectTotals: Record<string, { total: number; count: number }> = {}
                classExams.forEach(e => {
                    let scores = e.scores
                    if (typeof scores === 'string') {
                        try { scores = JSON.parse(scores) } catch { scores = null }
                    }
                    if (scores && typeof scores === 'object') {
                        Object.entries(scores as Record<string, any>).forEach(([subject, data]) => {
                            const net = typeof data === 'number' ? data : (data?.net ?? 0)
                            if (!subjectTotals[subject]) subjectTotals[subject] = { total: 0, count: 0 }
                            subjectTotals[subject].total += net
                            subjectTotals[subject].count += 1
                        })
                    }
                })
                Object.entries(subjectTotals).forEach(([subject, v]) => {
                    classSubjectAverages[subject] = Math.round((v.total / v.count) * 100) / 100
                })
            }
        }
    }

    // 4. Okul ortalamaları
    const { data: schoolExams } = await supabase
        .from('exam_results')
        .select('scores, total_net')
        .eq('organization_id', profile.organization_id)
        .eq('exam_name', exam.exam_name)
        .eq('exam_date', exam.exam_date || '')

    let schoolSubjectAverages: Record<string, number> = {}
    let schoolTotalAvg = 0

    if (schoolExams && schoolExams.length > 0) {
        schoolTotalAvg = Math.round(
            (schoolExams.reduce((sum, e) => sum + (e.total_net || 0), 0) / schoolExams.length) * 100
        ) / 100

        const subjectTotals: Record<string, { total: number; count: number }> = {}
        schoolExams.forEach(e => {
            let scores = e.scores
            if (typeof scores === 'string') {
                try { scores = JSON.parse(scores) } catch { scores = null }
            }
            if (scores && typeof scores === 'object') {
                Object.entries(scores as Record<string, any>).forEach(([subject, data]) => {
                    const net = typeof data === 'number' ? data : (data?.net ?? 0)
                    if (!subjectTotals[subject]) subjectTotals[subject] = { total: 0, count: 0 }
                    subjectTotals[subject].total += net
                    subjectTotals[subject].count += 1
                })
            }
        })
        Object.entries(subjectTotals).forEach(([subject, v]) => {
            schoolSubjectAverages[subject] = Math.round((v.total / v.count) * 100) / 100
        })
    }

    return {
        exam,
        classSubjectAverages,
        classTotalAvg,
        schoolSubjectAverages,
        schoolTotalAvg
    }
}

// Öğretmen için: Belirli bir sınavda sınıfın okul ortalamasıyla kıyaslanması
export async function getTeacherExamDetailData(examName: string, classId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // 1. Öğretmenin organization_id'sini al
    const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!teacherProfile) return null

    // 2. Sınıfın ortalamaları
    const { data: classExams } = await supabase
        .from('exam_results')
        .select(`
            total_net,
            scores,
            profiles!inner (
                class_id
            )
        `)
        .eq('exam_name', examName)
        .eq('profiles.class_id', classId)

    let classSubjectAverages: Record<string, number> = {}
    let classTotalAvg = 0

    if (classExams && classExams.length > 0) {
        classTotalAvg = Math.round(
            (classExams.reduce((sum, e) => sum + (e.total_net || 0), 0) / classExams.length) * 100
        ) / 100

        const subjectTotals: Record<string, { total: number; count: number }> = {}
        classExams.forEach(e => {
            let scores = e.scores
            if (typeof scores === 'string') {
                try { scores = JSON.parse(scores) } catch { scores = null }
            }
            if (scores && typeof scores === 'object') {
                Object.entries(scores as Record<string, any>).forEach(([subject, data]) => {
                    const net = typeof data === 'number' ? data : (data?.net ?? 0)
                    if (!subjectTotals[subject]) subjectTotals[subject] = { total: 0, count: 0 }
                    subjectTotals[subject].total += net
                    subjectTotals[subject].count += 1
                })
            }
        })
        Object.entries(subjectTotals).forEach(([subject, v]) => {
            classSubjectAverages[subject] = Math.round((v.total / v.count) * 100) / 100
        })
    }

    // 3. Okulun ortalamaları
    const { data: schoolExams } = await supabase
        .from('exam_results')
        .select('total_net, scores')
        .eq('exam_name', examName)
        .eq('organization_id', teacherProfile.organization_id)

    let schoolSubjectAverages: Record<string, number> = {}
    let schoolTotalAvg = 0

    if (schoolExams && schoolExams.length > 0) {
        schoolTotalAvg = Math.round(
            (schoolExams.reduce((sum, e) => sum + (e.total_net || 0), 0) / schoolExams.length) * 100
        ) / 100

        const subjectTotals: Record<string, { total: number; count: number }> = {}
        schoolExams.forEach(e => {
            let scores = e.scores
            if (typeof scores === 'string') {
                try { scores = JSON.parse(scores) } catch { scores = null }
            }
            if (scores && typeof scores === 'object') {
                Object.entries(scores as Record<string, any>).forEach(([subject, data]) => {
                    const net = typeof data === 'number' ? data : (data?.net ?? 0)
                    if (!subjectTotals[subject]) subjectTotals[subject] = { total: 0, count: 0 }
                    subjectTotals[subject].total += net
                    subjectTotals[subject].count += 1
                })
            }
        })
        Object.entries(subjectTotals).forEach(([subject, v]) => {
            schoolSubjectAverages[subject] = Math.round((v.total / v.count) * 100) / 100
        })
    }

    return {
        classSubjectAverages,
        classTotalAvg,
        schoolSubjectAverages,
        schoolTotalAvg
    }
}

