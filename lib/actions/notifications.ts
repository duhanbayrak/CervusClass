'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';
import { withAction } from '@/lib/actions/utils/with-action';

export type CreateNotificationParams = {
    userId: string;
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'success';
}

// Bildirim gönderme — diğer action'lardan çağrılır, kendi auth kontrolü yok
export async function createNotification({ userId, title, message, type = 'info' }: CreateNotificationParams) {
    const { error } = await supabaseAdmin
        .from('notifications')
        .insert({ user_id: userId, title, message, type });

    if (error) {
        logger.error('Bildirim oluşturulamadı', { action: 'createNotification', userId }, error);
    }
}

export async function createBulkNotifications(notifications: CreateNotificationParams[]) {
    const { error } = await supabaseAdmin
        .from('notifications')
        .insert(notifications.map(n => ({
            user_id: n.userId,
            title: n.title,
            message: n.message,
            type: n.type || 'info',
        })));

    if (error) {
        logger.error('Toplu bildirim oluşturulamadı', { action: 'createBulkNotifications', count: notifications.length }, error);
    }
}

export const getNotifications = withAction(async (ctx) => {
    const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
});

export const markNotificationAsRead = withAction(
    z.object({ notificationId: z.string().uuid() }),
    async ({ notificationId }, ctx) => {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', ctx.user.id);

        if (error) return { success: false, error: error.message };
        return { success: true };
    }
);

export const markAllNotificationsAsRead = withAction(async (ctx) => {
    const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', ctx.user.id)
        .eq('is_read', false);

    if (error) return { success: false, error: error.message };
    return { success: true };
});

