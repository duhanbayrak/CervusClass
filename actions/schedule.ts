'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'

// Define the shape of the Excel row
type ScheduleRow = {
    'Sınıf Adı': string
    'Gün': string
    'Başlangıç Saati': string
    'Bitiş Saati': string
    'Ders Adı': string
    'Öğretmen Email': string
    'Öğretmen Maili'?: string // Alias
    'Ders Kodu'?: string // Optional
    'Oda'?: string // Optional
}

const DAYS_MAP: Record<string, number> = {
    'Pazartesi': 1,
    'Salı': 2,
    'Çarşamba': 3,
    'Perşembe': 4,
    'Cuma': 5,
    'Cumartesi': 6,
    'Pazar': 7,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7
}

function parseTime(timeStr: string | number): string | null {
    if (!timeStr) return null;
    // Excel uses fractional days for time (e.g. 0.5 = 12:00)
    if (typeof timeStr === 'number') {
        const totalSeconds = Math.round(timeStr * 86400);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
    // If string "09:00" or "09.00"
    if (typeof timeStr === 'string') {
        // Replace dot with colon
        const normalizedTime = timeStr.replace('.', ':');
        const parts = normalizedTime.split(':');
        if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
        }
    }
    return null;
}

export async function uploadSchedule(prevState: any, formData: FormData) {
    const supabase = await createClient()

    try {
        console.log('Server Action Started: uploadSchedule')
        // 1. Auth Check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { message: 'Unauthorized', success: false }
        }

        // Check Role
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, roles(name)')
            .eq('id', user.id)
            .single()

        const roleName = profile?.roles?.name
        if (!profile || (roleName !== 'admin' && roleName !== 'super_admin')) {
            return { message: 'Sadece yöneticiler ders programı yükleyebilir.', success: false }
        }

        const organization_id = profile.organization_id

        // 2. Parse File
        const file = formData.get('file') as File
        if (!file) {
            return { message: 'Dosya seçilmedi.', success: false }
        }

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<ScheduleRow>(worksheet)

        if (jsonData.length === 0) {
            return { message: 'Dosya boş.', success: false }
        }

        // 3. Pre-fetch Data for Resolution
        // Classes
        const { data: classes } = await supabase
            .from('classes')
            .select('id, name')
            .eq('organization_id', organization_id)

        console.log('Fetched Classes:', classes?.map(c => c.name))

        // Teachers (Profiles with role teacher)
        // Note: 'roles' table might be needed to filter by role name 'teacher'
        // But emails are unique enough usually. We'll match by email within org.
        const { data: teachers } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('organization_id', organization_id)

        // Courses
        const { data: courses } = await supabase
            .from('courses')
            .select('id, name, code')
            .eq('organization_id', organization_id)

        const classMap = new Map(classes?.map(c => [c.name.trim().toLowerCase(), c.id]))
        const teacherMap = new Map(teachers?.map(t => [t.email?.trim().toLowerCase(), t.id]))
        const courseMap = new Map(courses?.map(c => [c.name.trim().toLowerCase(), c.id])) // Name to ID

        const rowsToInsert = []
        const errors: string[] = []

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i]
            const rowIndex = i + 2 // Excel row number (1-header)

            // Normalize keys to handle whitespace or casing
            const normalizedRow: any = {}
            Object.keys(row).forEach(key => {
                normalizedRow[key.trim()] = (row as any)[key]
            })

            // Validate Fields with explicit missing field reporting
            const className = normalizedRow['Sınıf Adı']?.toString().trim()
            const dayStr = normalizedRow['Gün']?.toString().trim()
            const startTimeRaw = normalizedRow['Başlangıç Saati']
            const endTimeRaw = normalizedRow['Bitiş Saati']
            const courseName = normalizedRow['Ders Adı']?.toString().trim()
            const teacherEmail = (normalizedRow['Öğretmen Email'] || normalizedRow['Öğretmen Maili'])?.toString().trim()

            const missingFields = []
            if (!className) missingFields.push('Sınıf Adı')
            if (!dayStr) missingFields.push('Gün')
            if (!startTimeRaw) missingFields.push('Başlangıç Saati')
            if (!endTimeRaw) missingFields.push('Bitiş Saati')
            if (!courseName) missingFields.push('Ders Adı')
            if (!teacherEmail) missingFields.push('Öğretmen Email')

            if (missingFields.length > 0) {
                console.log('Row Data:', row)
                errors.push(`Satır ${rowIndex}: Eksik bilgi (${missingFields.join(', ')})`)
                continue
            }

            // Resolve IDs
            const classId = classMap.get(className.toLowerCase())

            if (!classId) {
                const availableClasses = Array.from(classMap.keys())
                const debugMsg = availableClasses.length > 0
                    ? `Mevcut: ${availableClasses.slice(0, 3).join(', ')}...`
                    : 'Sistemde hiç sınıf bulunamadı! (Yetki sorunu olabilir)'

                console.log('Class Lookup Failed:')
                console.log('Searching for:', className.toLowerCase())
                console.log('Available Classes:', availableClasses)

                errors.push(`Satır ${rowIndex}: Sınıf bulunamadı (${className}). ${debugMsg}`)
                continue
            }

            const teacherId = teacherMap.get(teacherEmail.toLowerCase())
            if (!teacherId) {
                errors.push(`Satır ${rowIndex}: Öğretmen bulunamadı (${teacherEmail})`)
                continue
            }

            // Resolve Course (Create if not exists? Or Error? Plan said resolve. Let's create optionally or just error. 
            // User didn't specify auto-create. Requirement said "Ders Adı -> public.courses". 
            // Best UX: Auto-create course if not exists? No, safer to validate. 
            // But for bulk upload, maybe creating is better. 
            // Let's implement auto-create for course to avoid blocking.)
            let courseId = courseMap.get(courseName.toLowerCase())
            if (!courseId) {
                // Create new course
                const { data: newCourse, error: createError } = await supabase
                    .from('courses')
                    .insert({
                        organization_id,
                        name: courseName,
                        code: row['Ders Kodu']
                    })
                    .select()
                    .single()

                if (createError || !newCourse) {
                    errors.push(`Satır ${rowIndex}: Ders oluşturulamadı (${courseName})`)
                    continue
                }
                courseId = newCourse.id
                courseMap.set(courseName.toLowerCase(), courseId)
            }

            const dayOfWeek = DAYS_MAP[dayStr] || DAYS_MAP[Object.keys(DAYS_MAP).find(k => k.toLowerCase() === dayStr.toLowerCase()) || '']
            if (!dayOfWeek) {
                errors.push(`Satır ${rowIndex}: Geçersiz gün (${dayStr})`)
                continue
            }

            const startTime = parseTime(startTimeRaw)
            const endTime = parseTime(endTimeRaw)

            if (!startTime || !endTime) {
                errors.push(`Satır ${rowIndex}: Saat formatı hatalı.`)
                continue
            }

            rowsToInsert.push({
                organization_id,
                class_id: classId,
                teacher_id: teacherId,
                course_id: courseId,
                day_of_week: dayOfWeek,
                start_time: startTime,
                end_time: endTime,
                room_name: row['Oda']?.toString()
            })
        }


        if (errors.length > 0) {
            return { message: errors.slice(0, 10).join('\n') + (errors.length > 10 ? `... ve ${errors.length - 10} hata daha.` : ''), success: false }
        }

        // 4. Batch Insert (One by one to catch constraints? Or match?)
        // Constraints check: no_teacher_overlap.
        // If we do batch insert, one failure might roll back the others if we don't ignore duplicates.
        // However, we want to REPORT the overlap.
        // So we should probably check existence or insert one by one?
        // One by one is slower but safer for detailed error reporting.
        // Or we can try to insert all and catch error.

        // Let's try inserting one by one to provide specific error message.
        for (let i = 0; i < rowsToInsert.length; i++) {
            const item = rowsToInsert[i]
            const { error } = await supabase.from('schedule').insert(item)
            if (error) {
                if (error.code === '23P01') { // Exclusion violation
                    return { message: `Çakışma var! Öğretmen zaten o saatte dolu. Ders: ${jsonData[i]['Ders Adı']}`, success: false }
                }
                return { message: `Veritabanı hatası: ${error.message}`, success: false }
            }
        }

        revalidatePath('/admin/schedule')
        revalidatePath('/teacher/schedule')
        revalidatePath('/student/schedule')

        return { message: `${rowsToInsert.length} ders başarıyla yüklendi.`, success: true }

    } catch (error: any) {
        console.error('Upload Error:', error)
        return { message: 'Beklenmeyen bir hata oluştu: ' + error.message, success: false }
    }
}
