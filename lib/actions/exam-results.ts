'use server'

import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { createBulkNotifications } from '@/lib/actions/notifications'
import { logger } from '@/lib/logger'

const EXAM_FILES_BUCKET = 'exam-files'

async function validateExamUploadRequest(formData: FormData) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Oturum açmanız gerekiyor.' }

    const { data: profile } = await supabase.from('profiles').select('organization_id, roles(name)').eq('id', user.id).single()
    const roleName = (profile?.roles as { name?: string } | null)?.name
    if (roleName !== 'admin' && roleName !== 'super_admin') return { error: 'Yetkiniz yok.' }
    if (!profile?.organization_id) return { error: 'Kurum bilginiz bulunamadı.' }

    const examName = formData.get('exam_name') as string
    if (!examName) return { error: 'Sınav ismi girmelisiniz.' }
    const examType = formData.get('exam_type') as string
    if (!examType || (examType !== 'TYT' && examType !== 'AYT')) return { error: 'Geçerli bir sınav türü seçmelisiniz (TYT veya AYT).' }
    const file = formData.get('file') as File
    if (!file) return { error: 'Dosya seçilmedi.' }
    if (!file.name.endsWith('.xlsx')) return { error: 'Sadece Excel (.xlsx) dosyaları yüklenebilir.' }

    return { supabase, user, organizationId: profile.organization_id, examName, examType, file }
}

async function notifyStudentsAboutExam(organizationId: string, examName: string): Promise<void> {
    const { data: studentRole } = await supabaseAdmin.from('roles').select('id').eq('name', 'student').single()
    if (!studentRole) return
    const { data: students } = await supabaseAdmin.from('profiles').select('id').eq('role_id', studentRole.id).eq('organization_id', organizationId)
    if (!students?.length) return
    const notifications = students.map(s => ({
        userId: s.id,
        title: 'Yeni Sınav Sonucu 📊',
        message: `${examName} sınav sonuçları yayınlandı. Sonuçlarınızı kontrol edin.`,
        type: 'info' as const,
    }))
    await createBulkNotifications(notifications)
}

export async function uploadExamResult(prevState: unknown, formData: FormData) {
    const validated = await validateExamUploadRequest(formData)
    if ('error' in validated) return { success: false, message: validated.error }

    const { supabase, user, organizationId, examName, examType, file } = validated

    // 3. Upload to Supabase Storage
    const timestamp = Date.now()
    // Clean filename to avoid issues
    const cleanFileName = file.name.replaceAll(/[^a-zA-Z0-9.-]/g, '_')
    // Organize by Organization ID for security and RLS
    const filePath = `${organizationId}/${timestamp}-${cleanFileName}`

    const { error: storageError } = await supabase
        .storage
        .from(EXAM_FILES_BUCKET)
        .upload(filePath, file)

    if (storageError) {
        logger.error('Storage Upload Error', { action: 'uploadExamResult' }, storageError)
        return { success: false, message: 'Dosya yüklenirken hata oluştu: ' + storageError.message }
    }

    // 4. Get Signed URL (Secure access)
    // Valid for 1 hour (3600 seconds) - enough for n8n to process
    const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from(EXAM_FILES_BUCKET)
        .createSignedUrl(filePath, 3600)

    if (signedUrlError || !signedUrlData?.signedUrl) {
        return { success: false, message: 'İmzalı URL oluşturulamadı.' }
    }

    const fileUrl = signedUrlData.signedUrl

    // 5. Trigger n8n Webhook
    const webhookUrl = process.env.N8N_EXAM_WEBHOOK_URL

    if (webhookUrl) {
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file_url: fileUrl,
                    exam_name: examName,
                    exam_type: examType, // Include exam_type in payload
                    admin_id: user.id,
                    organization_id: organizationId,
                    uploaded_at: new Date().toISOString(),
                    original_name: file.name
                }),
            })

            if (!response.ok) {
                logger.warn('n8n Webhook Error', { action: 'uploadExamResult' })
                return { success: true, message: 'Dosya yüklendi fakat işlem sırasına alınamadı (Webhook Hatası).' }
            }
        } catch (webhookError) {
            logger.error('n8n Fetch Error', { action: 'uploadExamResult' }, webhookError)
            return { success: true, message: 'Dosya yüklendi fakat n8n tetiklenemedi.' }
        }
    } else {
        logger.warn('N8N_EXAM_WEBHOOK_URL tanımlı değil', { action: 'uploadExamResult' })
    }

    revalidatePath('/admin/exams')

    try {
        await notifyStudentsAboutExam(organizationId, examName)
    } catch (notifError) {
        logger.error('Sınav bildirimi gönderilemedi', { action: 'uploadExamResult' }, notifError)
    }

    return {
        success: true,
        message: 'Dosya başarıyla yüklendi ve işleme alındı.',
        fileUrl: fileUrl
    }
}
