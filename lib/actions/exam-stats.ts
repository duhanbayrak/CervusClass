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

    // 2. RPC ile veritabanında hesaplanmış istatistikleri çek
    // 'get_exam_stats' is a new function, avoiding type errors until types are regenerated
    const { data, error } = await supabase
        .rpc('get_exam_stats' as any, {
            p_organization_id: profile.organization_id,
            p_student_id: targetStudentId,
            p_class_id: profile.class_id || null
        });

    if (error) {
        console.error('Error fetching exam stats:', error);
        return { studentExams: [], classAverages: [], schoolAverages: [] };
    }

    // RPC'den dönen veriyi uygun formata dönüştür (JSON olarak geliyor)
    const stats = data as any;
    const result = stats || {};

    return {
        studentExams: result.studentExams || [],
        classAverages: result.classAverages || [],
        schoolAverages: result.schoolAverages || [],
        classSubjectOverview: result.classSubjectOverview || [],
        schoolSubjectOverview: result.schoolSubjectOverview || []
    }
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

