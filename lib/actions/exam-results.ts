'use server'

import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { createBulkNotifications } from '@/lib/actions/notifications'
import { logger } from '@/lib/logger'

const EXAM_FILES_BUCKET = 'exam-files'

export async function uploadExamResult(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // 1. Check Auth & Admin Role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Oturum açmanız gerekiyor.' }
    }

    // Verify Admin role and get Organization ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, roles(name)')
        .eq('id', user.id)
        .single()

    const roleName = profile?.roles?.name
    if (roleName !== 'admin' && roleName !== 'super_admin') {
        return { success: false, message: 'Yetkiniz yok.' }
    }

    const organizationId = profile?.organization_id
    if (!organizationId) {
        return { success: false, message: 'Kurum bilginiz bulunamadı.' }
    }

    // 2. Validate Input
    const examName = formData.get('exam_name') as string
    if (!examName) {
        return { success: false, message: 'Sınav ismi girmelisiniz.' }
    }

    const examType = formData.get('exam_type') as string
    if (!examType || (examType !== 'TYT' && examType !== 'AYT')) {
        return { success: false, message: 'Geçerli bir sınav türü seçmelisiniz (TYT veya AYT).' }
    }

    const file = formData.get('file') as File
    if (!file) {
        return { success: false, message: 'Dosya seçilmedi.' }
    }

    if (!file.name.endsWith('.xlsx')) {
        return { success: false, message: 'Sadece Excel (.xlsx) dosyaları yüklenebilir.' }
    }

    // 3. Upload to Supabase Storage
    const timestamp = Date.now()
    // Clean filename to avoid issues
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    // Organize by Organization ID for security and RLS
    const filePath = `${organizationId}/${timestamp}-${cleanFileName}`

    const { data: storageData, error: storageError } = await supabase
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

    // Tüm öğrencilere sınav sonucu bildirimi gönder
    try {
        // Öğrenci rolünü bul
        const { data: studentRole } = await supabaseAdmin
            .from('roles')
            .select('id')
            .eq('name', 'student')
            .single();

        if (studentRole) {
            const { data: students } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('role_id', studentRole.id)
                .eq('organization_id', organizationId);

            if (students && students.length > 0) {
                const notifications = students.map(s => ({
                    userId: s.id,
                    title: 'Yeni Sınav Sonucu 📊',
                    message: `${examName} sınav sonuçları yayınlandı. Sonuçlarınızı kontrol edin.`,
                    type: 'info' as const,
                }));
                await createBulkNotifications(notifications);
            }
        }
    } catch (notifError) {
        logger.error('Sınav bildirimi gönderilemedi', { action: 'uploadExamResult' }, notifError);
    }

    return {
        success: true,
        message: 'Dosya başarıyla yüklendi ve işleme alındı.',
        fileUrl: fileUrl
    }
}
