'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkBlockStatus } from './moderation';

export type NotificationType = 'follow' | 'remix' | 'like' | 'save' | 'achievement' | 'report' | 'moderation' | 'verification';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  entityId: string | null;
  text: string;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
}

/**
 * Fetch notifications for the logged-in creator.
 */
export async function getNotifications(): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(id, username, full_name, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      type: item.type as NotificationType,
      entityId: item.entity_id,
      text: item.text,
      isRead: item.is_read,
      createdAt: item.created_at,
      actor: item.actor ? {
        id: item.actor.id,
        username: item.actor.username,
        fullName: item.actor.full_name,
        avatarUrl: item.actor.avatar_url
      } : null
    })) || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Get count of unread notifications.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .match({ id: notificationId, user_id: user.id });

    if (error) throw error;

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
}


/**
 * Internal Server action to create a notification safely.
 * Checks for block relations before sending.
 */
export async function triggerNotification(
  recipientUserId: string,
  actorId: string | null,
  type: NotificationType,
  entityId: string | null,
  text: string
) {
  const supabase = await createClient();

  // If there is an actor, ensure they aren't blocked by the recipient, and haven't blocked the recipient
  if (actorId) {
    if (recipientUserId === actorId) return { success: false, error: 'Self notifications ignored' };

    // Check block status (running as system / server query bypasses standard RLS constraints check status)
    const { data: blockExists } = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(blocker_id.eq.${recipientUserId},blocked_id.eq.${actorId}),and(blocker_id.eq.${actorId},blocked_id.eq.${recipientUserId})`)
      .limit(1);

    if (blockExists && blockExists.length > 0) {
      return { success: false, error: 'Blocked relationship. Notification dropped.' };
    }
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: recipientUserId,
        actor_id: actorId,
        type,
        entity_id: entityId,
        text,
        is_read: false
      }]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Failed to trigger notification:', error);
    return { success: false };
  }
}
