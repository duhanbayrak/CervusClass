'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

const EXAM_FILES_BUCKET = 'exam-files'

export async function uploadExamResult(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // 1. Check Auth & Admin Role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Oturum açmanız gerekiyor.' }
    }

    // Verify Admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('roles(name)')
        .eq('id', user.id)
        .single()

    const roleName = profile?.roles?.name
    if (roleName !== 'admin' && roleName !== 'super_admin') {
        return { success: false, message: 'Yetkiniz yok.' }
    }

    // 2. Validate Input
    const examName = formData.get('exam_name') as string
    if (!examName) {
        return { success: false, message: 'Sınav ismi girmelisiniz.' }
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
    const filePath = `${timestamp}-${cleanFileName}`

    const { data: storageData, error: storageError } = await supabase
        .storage
        .from(EXAM_FILES_BUCKET)
        .upload(filePath, file)

    if (storageError) {
        console.error('Storage Upload Error:', storageError)
        return { success: false, message: 'Dosya yüklenirken hata oluştu: ' + storageError.message }
    }

    // 4. Get Public URL (or Signed URL if bucket is private)
    // Assuming public bucket for simplicity, or we generate a signed URL for n8n
    const { data: publicUrlData } = supabase
        .storage
        .from(EXAM_FILES_BUCKET)
        .getPublicUrl(filePath)

    const fileUrl = publicUrlData.publicUrl

    // 5. Trigger n8n Webhook
    // TODO: Replace with actual n8n webhook URL from env or user input
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
                    admin_id: user.id,
                    uploaded_at: new Date().toISOString(),
                    original_name: file.name
                }),
            })

            if (!response.ok) {
                console.error('n8n Webhook Error:', await response.text())
                return { success: true, message: 'Dosya yüklendi fakat işlem sırasına alınamadı (Webhook Hatası).' }
            }
        } catch (webhookError) {
            console.error('n8n Fetch Error:', webhookError)
            return { success: true, message: 'Dosya yüklendi fakat n8n tetiklenemedi.' }
        }
    } else {
        console.warn('N8N_EXAM_WEBHOOK_URL is not defined.')
    }

    revalidatePath('/admin/exams')

    return {
        success: true,
        message: 'Dosya başarıyla yüklendi ve işleme alındı.',
        fileUrl: fileUrl
    }
}
