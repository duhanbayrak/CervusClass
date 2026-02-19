'use server'

import { createClient } from '@/lib/supabase-server'

// Öğrencinin tüm sınavları + sınıf ortalaması + okul ortalaması
import { flattenExamScores } from '@/lib/utils'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

    // 2. Öğrencinin sınavlarını çek
    const { data: studentExams, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', targetStudentId)
        .order('exam_date', { ascending: false })

    if (error || !studentExams || studentExams.length === 0) {
        console.error('Error fetching student exams:', error);
        return {
            studentExams: [],
            classAverages: [],
            schoolAverages: [],
            classSubjectOverview: [],
            schoolSubjectOverview: []
        };
    }

    // 3. Bu sınavlar için sınıf ve okul verilerini çek
    // Sadece öğrencinin girdiği sınavların isimlerini alıyoruz
    const examNames = studentExams.map(e => e.exam_name)

    // Okuldaki bu sınavlara ait tüm sonuçları çek (sınıf filtresini JS tarafında veya ayrı sorguda yapabiliriz ama
    // tek sorguda çekip memory'de ayırmak daha verimli olabilir)
    const { data: allPeerResults } = await supabaseAdmin
        .from('exam_results')
        .select(`
            exam_name,
            exam_date,
            scores,
            total_net,
            student_id,
            profiles!inner (
                class_id
            )
        `)
        .eq('organization_id', profile.organization_id)
        .in('exam_name', examNames)

    // Verileri grupla ve ortalamaları hesapla
    const classStats: Record<string, { totalNet: number, count: number, subjects: Record<string, { total: number, count: number }> }> = {}
    const schoolStats: Record<string, { totalNet: number, count: number, subjects: Record<string, { total: number, count: number }> }> = {}

    const processResult = (result: any, statsMap: Record<string, any>, examType: string) => {
        // Key: examName + examDate
        const key = `${result.exam_name}_${result.exam_date || ''}`

        if (!statsMap[key]) {
            statsMap[key] = {
                exam_name: result.exam_name,
                exam_date: result.exam_date, // Keep original date
                totalNet: 0,
                count: 0,
                subjects: {}
            }
        }

        const entry = statsMap[key]
        entry.totalNet += (result.total_net || 0)
        entry.count += 1

        const flatScores = flattenExamScores(result.scores, examType)
        Object.entries(flatScores).forEach(([sub, net]) => {
            if (net !== null && typeof net === 'number') {
                if (!entry.subjects[sub]) entry.subjects[sub] = { total: 0, count: 0 }
                entry.subjects[sub].total += net
                entry.subjects[sub].count += 1
            }
        })
    }

    // Öğrenci sınavlarının tiplerini (TYT/AYT) hızlı erişim için map'le
    const examTypes = new Map(studentExams.map(e => [e.exam_name, e.exam_type]))

    allPeerResults?.forEach((result: any) => {
        const type = examTypes.get(result.exam_name) || 'TYT'

        // School Stats (Herkes dahil)
        processResult(result, schoolStats, type)

        // Class Stats (Sadece aynı sınıftakiler)
        if (profile.class_id && result.profiles.class_id === profile.class_id) {
            processResult(result, classStats, type)
        }
    })

    // Format results for frontend
    const formatStats = (statsMap: Record<string, any>) => {
        return Object.values(statsMap).map(stat => {
            const subjectsAvg: Record<string, number> = {}
            Object.entries(stat.subjects).forEach(([sub, val]: [string, any]) => {
                subjectsAvg[sub] = Number((val.total / val.count).toFixed(2))
            })

            return {
                exam_name: stat.exam_name,
                exam_date: stat.exam_date,
                avg_net: Number((stat.totalNet / stat.count).toFixed(2)),
                subjects: subjectsAvg
            }
        })
    }

    const classAverages = formatStats(classStats)
    const schoolAverages = formatStats(schoolStats)

    // Averages array structure (net averages per exam)
    const classAvgSimple = classAverages.map(c => ({ exam_name: c.exam_name, exam_date: c.exam_date, avg_net: c.avg_net }))
    const schoolAvgSimple = schoolAverages.map(s => ({ exam_name: s.exam_name, exam_date: s.exam_date, avg_net: s.avg_net }))

    return {
        studentExams,
        classAverages: classAvgSimple,
        schoolAverages: schoolAvgSimple,
        classSubjectOverview: classAverages,
        schoolSubjectOverview: schoolAverages
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
            const { data: classExams } = await supabaseAdmin
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
                    const flatScores = flattenExamScores(e.scores, exam.exam_type)
                    Object.entries(flatScores).forEach(([subject, net]) => {
                        if (net !== null) {
                            if (!subjectTotals[subject]) subjectTotals[subject] = { total: 0, count: 0 }
                            subjectTotals[subject].total += net
                            subjectTotals[subject].count += 1
                        }
                    })
                })
                Object.entries(subjectTotals).forEach(([subject, v]) => {
                    classSubjectAverages[subject] = Math.round((v.total / v.count) * 100) / 100
                })
            }
        }
    }

    // 4. Okul ortalamaları
    const { data: schoolExams } = await supabaseAdmin
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
            const flatScores = flattenExamScores(e.scores, exam.exam_type)
            Object.entries(flatScores).forEach(([subject, net]) => {
                if (net !== null) {
                    if (!subjectTotals[subject]) subjectTotals[subject] = { total: 0, count: 0 }
                    subjectTotals[subject].total += net
                    subjectTotals[subject].count += 1
                }
            })
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
            const flatScores = flattenExamScores(e.scores)
            Object.entries(flatScores).forEach(([subject, net]) => {
                if (net !== null) {
                    if (!subjectTotals[subject]) subjectTotals[subject] = { total: 0, count: 0 }
                    subjectTotals[subject].total += net
                    subjectTotals[subject].count += 1
                }
            })
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
            const flatScores = flattenExamScores(e.scores)
            Object.entries(flatScores).forEach(([subject, net]) => {
                if (net !== null) {
                    if (!subjectTotals[subject]) subjectTotals[subject] = { total: 0, count: 0 }
                    subjectTotals[subject].total += net
                    subjectTotals[subject].count += 1
                }
            })
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

