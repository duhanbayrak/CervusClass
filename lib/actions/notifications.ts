'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthContext } from '@/lib/auth-context';

interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'success';
}

export async function createNotification({ userId, title, message, type = 'info' }: CreateNotificationParams) {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
            });

        if (error) {
            console.error('Notification insert error:', error);
        }
    } catch (e) {
        console.error('Failed to create notification:', e);
    }
}

export async function createBulkNotifications(notifications: CreateNotificationParams[]) {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .insert(notifications.map(n => ({
                user_id: n.userId,
                title: n.title,
                message: n.message,
                type: n.type || 'info',
            })));

        if (error) {
            console.error('Bulk notification insert error:', error);
        }
    } catch (e) {
        console.error('Failed to create bulk notifications:', e);
    }
}

export async function getNotifications() {
    try {
        const { user, error: authError } = await getAuthContext();
        if (authError || !user) return { data: [], error: 'Oturum bulunamadı' };

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) return { data: [], error: error.message };
        return { data: data || [] };
    } catch {
        return { data: [], error: 'Beklenmedik hata' };
    }
}

export async function markNotificationAsRead(notificationId: string) {
    try {
        const { user, error: authError } = await getAuthContext();
        if (authError || !user) return { error: 'Oturum bulunamadı' };

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', user.id);

        if (error) return { error: error.message };
        return { success: true };
    } catch {
        return { error: 'Beklenmedik hata' };
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const { user, error: authError } = await getAuthContext();
        if (authError || !user) return { error: 'Oturum bulunamadı' };

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) return { error: error.message };
        return { success: true };
    } catch {
        return { error: 'Beklenmedik hata' };
    }
}

