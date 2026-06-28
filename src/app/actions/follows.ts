'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { triggerNotification } from './notifications';
import { checkBlockStatus, assertNotSuspendedOrBanned } from './moderation';
import { rateLimit } from '@/lib/rateLimit';
import { getClientIpHash } from './interactions';

export async function toggleFollow(targetId: string, currentlyFollowing: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await assertNotSuspendedOrBanned(user.id);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
  
  if (user.id === targetId) {
    return { success: false, error: 'Cannot follow yourself' };
  }

  // Prevent following if there is a bidirectional block
  const { anyBlock } = await checkBlockStatus(targetId);
  if (anyBlock) {
    return { success: false, error: 'Cannot follow this creator due to safety settings.' };
  }

  // Rate limit: 30 follow/unfollow actions per minute per user, 60 per minute per IP
  const ipHash = await getClientIpHash();
  const userLimit = await rateLimit(user.id, 'follow', 30, 60 * 1000);
  if (!userLimit.success) {
    return { success: false, error: 'Too many follow actions. Please slow down.' };
  }
  const ipLimitRes = await rateLimit(ipHash, 'follow', 60, 60 * 1000);
  if (!ipLimitRes.success) {
    return { success: false, error: 'Too many follow actions. Please slow down.' };
  }

  try {
    if (currentlyFollowing) {
      // Unfollow
      const { error } = await supabase
        .from('followers')
        .delete()
        .match({ follower_id: user.id, following_id: targetId });
        
      if (error) throw error;
      
      revalidatePath(`/creator/${targetId}`);
      return { success: true, isFollowing: false };
    } else {
      // Follow
      const { error } = await supabase
        .from('followers')
        .insert([{ follower_id: user.id, following_id: targetId }]);
        
      if (error) {
        if (error.code === '23505') {
          return { success: true, isFollowing: true };
        }
        throw error;
      }
      
      // Trigger Follower Notification
      await triggerNotification(
        targetId,
        user.id,
        'follow',
        null,
        'started following you'
      );
      
      revalidatePath(`/creator/${targetId}`);
      return { success: true, isFollowing: true };
    }
  } catch (err: any) {
    console.error('Error toggling follow:', err);
    return { success: false, error: err.message };
  }
}

export async function checkIsFollowing(targetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  try {
    const { data, error } = await supabase
      .from('followers')
      .select('follower_id')
      .match({ follower_id: user.id, following_id: targetId })
      .maybeSingle();
      
    if (error) {
      // Silently fail if table doesn't exist yet
      if (error.code === '42P01') return false; 
      throw error;
    }
    return !!data;
  } catch (err: any) {
    // Only log if it's not a missing table error
    console.warn('Follow status check failed:', err.message || 'Table might not exist yet.');
    return false;
  }
}

export async function getFollowers(userId: string) {
  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = ['super_admin', 'admin', 'moderator'].includes(profile?.role || '');
    }

    const { data, error } = await supabase
      .from('followers')
      .select(`
        follower:profiles!follower_id (
          id,
          username,
          full_name,
          avatar_url,
          bio,
          follower_count,
          following_count,
          role
        )
      `)
      .eq('following_id', userId);

    if (error) throw error;
    return (data || [])
      .map((d: any) => d.follower)
      .filter(Boolean)
      .filter((p: any) => isAdmin || !['suspended', 'banned', 'permanently_banned', 'disabled'].includes(p.role || 'user'));
  } catch (error) {
    console.error('Error in getFollowers:', error);
    return [];
  }
}

export async function getFollowing(userId: string) {
  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = ['super_admin', 'admin', 'moderator'].includes(profile?.role || '');
    }

    const { data, error } = await supabase
      .from('followers')
      .select(`
        following:profiles!following_id (
          id,
          username,
          full_name,
          avatar_url,
          bio,
          follower_count,
          following_count,
          role
        )
      `)
      .eq('follower_id', userId);

    if (error) throw error;
    return (data || [])
      .map((d: any) => d.following)
      .filter(Boolean)
      .filter((p: any) => isAdmin || !['suspended', 'banned', 'permanently_banned', 'disabled'].includes(p.role || 'user'));
  } catch (error) {
    console.error('Error in getFollowing:', error);
    return [];
  }
}

export async function removeFollower(followerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await assertNotSuspendedOrBanned(user.id);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  // Rate limit: 30 remove-follower actions per minute per user
  const removeLimit = await rateLimit(user.id, 'remove_follower', 30, 60 * 1000);
  if (!removeLimit.success) {
    return { success: false, error: 'Too many actions. Please slow down.' };
  }

  try {
    const { error } = await supabase
      .from('followers')
      .delete()
      .match({ follower_id: followerId, following_id: user.id });
      
    if (error) throw error;
    
    revalidatePath(`/creator/${user.id}`);
    return { success: true };
  } catch (err: any) {
    console.error('Error removing follower:', err);
    return { success: false, error: err.message };
  }
}
