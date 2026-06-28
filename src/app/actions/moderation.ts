'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { triggerNotification } from './notifications';

/**
 * Block a creator. This also deletes follow records between both users in both directions.
 */
export async function blockUser(blockedId: string) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("Authentication required");
  }

  const user = session.user;

  if (user.id === blockedId) {
    return { success: false, error: 'You cannot block yourself.' };
  }

  try {
    // 1. Insert Block Record
    const { error: blockError } = await supabase
      .from('blocked_users')
      .insert([{ blocker_id: user.id, blocked_id: blockedId }]);

    if (blockError) {
      if (blockError.code === '23505') {
        return { success: true, message: 'User is already blocked.' };
      }
      throw blockError;
    }

    // 2. Clean up follow relations between both parties in both directions
    await supabase
      .from('followers')
      .delete()
      .or(`and(follower_id.eq.${user.id},following_id.eq.${blockedId}),and(follower_id.eq.${blockedId},following_id.eq.${user.id})`);

    revalidatePath(`/creator/${blockedId}`);
    revalidatePath('/discover');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error blocking user:', error);
    return { success: false, error: error.message || 'Failed to block user.' };
  }
}

/**
 * Unblock a creator.
 */
export async function unblockUser(blockedId: string) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("Authentication required");
  }

  const user = session.user;

  try {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .match({ blocker_id: user.id, blocked_id: blockedId });

    if (error) throw error;

    revalidatePath('/settings');
    revalidatePath(`/creator/${blockedId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error unblocking user:', error);
    return { success: false, error: error.message || 'Failed to unblock user.' };
  }
}

/**
 * Fetch list of creators blocked by the current user.
 */
export async function getBlockedUsers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('blocked_id, profiles!blocked_users_blocked_id_fkey(id, username, full_name, avatar_url)')
      .eq('blocker_id', user.id);

    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }

    return data.map((item: any) => ({
      id: item.profiles.id,
      username: item.profiles.username,
      fullName: item.profiles.full_name,
      avatarUrl: item.profiles.avatar_url
    })) || [];
  } catch (error: any) {
    if (error?.code === '42P01') return [];
    console.error('Error fetching blocked users:', error);
    return [];
  }
}

/**
 * Check if there is any block in place between two creators (bidirectional).
 */
export async function checkBlockStatus(otherUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { isBlockedByMe: false, hasBlockedMe: false, anyBlock: false };

  try {
    const { data: blocks, error } = await supabase
      .from('blocked_users')
      .select('blocker_id, blocked_id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id})`);

    if (error) {
      if (error.code === '42P01') {
        return { isBlockedByMe: false, hasBlockedMe: false, anyBlock: false };
      }
      throw error;
    }

    const isBlockedByMe = blocks?.some(b => b.blocker_id === user.id) || false;
    const hasBlockedMe = blocks?.some(b => b.blocker_id === otherUserId) || false;

    return {
      isBlockedByMe,
      hasBlockedMe,
      anyBlock: isBlockedByMe || hasBlockedMe
    };
  } catch (error: any) {
    if (error?.code === '42P01') {
      return { isBlockedByMe: false, hasBlockedMe: false, anyBlock: false };
    }
    console.error('Error checking block status:', error);
    return { isBlockedByMe: false, hasBlockedMe: false, anyBlock: false };
  }
}

/**
 * Get a list of creator IDs that the user has blocked OR who have blocked the user.
 * Used for dynamic feed filtering.
 */
export async function getBlockedUserIdsFilter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const { data: blocks, error } = await supabase
      .from('blocked_users')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

    if (error) {
      const errMsg = error.message || '';
      if (error.code === '42P01' || errMsg.includes('does not exist') || errMsg.includes('not found')) {
        return [];
      }
      throw error;
    }

    const ids = new Set<string>();
    blocks?.forEach((b: any) => {
      if (b.blocker_id !== user.id) ids.add(b.blocker_id);
      if (b.blocked_id !== user.id) ids.add(b.blocked_id);
    });

    return Array.from(ids);
  } catch (error: any) {
    const errMsg = error?.message || '';
    if (error?.code === '42P01' || errMsg.includes('does not exist') || errMsg.includes('not found')) {
      return [];
    }
    console.error('Error fetching block filters:', error);
    return [];
  }
}

/**
 * Submit a report for a creator.
 */
export async function reportUser(reportedId: string, reason: string, details?: string) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("Authentication required");
  }

  const user = session.user;

  if (user.id === reportedId) {
    return { success: false, error: 'You cannot report yourself.' };
  }

  try {
    // Rate Limiting: Per-IP and Per-User
    try {
      const { rateLimit } = await import('@/lib/rateLimit');
      const { getClientIpHash } = await import('./interactions');
      const ipHash = await getClientIpHash();
      
      const ipLimit = await rateLimit(ipHash, 'report_ip', 10, 60 * 60 * 1000);
      if (!ipLimit.success) {
        return { success: false, error: 'Rate limit exceeded: Too many reports from this IP address. Please try again later.' };
      }
      
      const userLimit = await rateLimit(user.id, 'report_user', 5, 60 * 60 * 1000);
      if (!userLimit.success) {
        return { success: false, error: 'Rate limit exceeded: You can submit at most 5 reports per hour.' };
      }
    } catch (limitErr) {
      console.warn('Rate limiter check failed to execute:', limitErr);
    }

    // Check for existing pending/under_review reports from same user for this creator
    const { data: existingReport, error: checkError } = await supabase
      .from('user_reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('reported_id', reportedId)
      .in('status', ['pending', 'under_review'])
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingReport) {
      return { success: false, error: 'You already have an active report for this item.' };
    }

    const { error } = await supabase
      .from('user_reports')
      .insert([{
        reporter_id: user.id,
        reported_id: reportedId,
        reason,
        details: details || ''
      }]);

    if (error) throw error;

    // Immediately send a notification to the reporter
    await triggerNotification(
      user.id,
      null,
      'report',
      reportedId,
      `Your report against creator (ID: ${reportedId.substring(0, 8)}...) for "${reason}" has been submitted successfully.`
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting user report:', error);
    return { success: false, error: error.message || 'Failed to submit report.' };
  }
}

/**
 * Submit a report for a specific prompt.
 */
export async function reportPrompt(promptId: string, reason: string, details?: string) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("Authentication required");
  }

  const user = session.user;

  try {
    // Self-reporting validation
    const { data: targetPrompt } = await supabase
      .from('prompts')
      .select('user_id, title, prompt_text, negative_prompt, image_url, ai_tool, category')
      .eq('id', promptId)
      .maybeSingle();

    if (targetPrompt && targetPrompt.user_id === user.id) {
      return { success: false, error: 'You cannot report your own prompt.' };
    }

    // Rate Limiting: Per-IP and Per-User
    try {
      const { rateLimit } = await import('@/lib/rateLimit');
      const { getClientIpHash } = await import('./interactions');
      const ipHash = await getClientIpHash();
      
      const ipLimit = await rateLimit(ipHash, 'report_ip', 10, 60 * 60 * 1000);
      if (!ipLimit.success) {
        return { success: false, error: 'Rate limit exceeded: Too many reports from this IP address. Please try again later.' };
      }
      
      const userLimit = await rateLimit(user.id, 'report_user', 5, 60 * 60 * 1000);
      if (!userLimit.success) {
        return { success: false, error: 'Rate limit exceeded: You can submit at most 5 reports per hour.' };
      }
    } catch (limitErr) {
      console.warn('Rate limiter check failed to execute:', limitErr);
    }

    // Check for existing pending/under_review reports from same user for this prompt
    const { data: existingReport, error: checkError } = await supabase
      .from('prompt_reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('prompt_id', promptId)
      .in('status', ['pending', 'under_review'])
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingReport) {
      return { success: false, error: 'You already have an active report for this item.' };
    }

    // Build the prompt snapshot for evidence preservation
    const snapshot = targetPrompt ? {
      title: targetPrompt.title,
      prompt_text: targetPrompt.prompt_text,
      negative_prompt: targetPrompt.negative_prompt,
      image_url: targetPrompt.image_url,
      ai_tool: targetPrompt.ai_tool,
      category: targetPrompt.category
    } : null;

    const { error } = await supabase
      .from('prompt_reports')
      .insert([{
        reporter_id: user.id,
        prompt_id: promptId,
        reason,
        details: details || '',
        prompt_snapshot: snapshot
      }]);

    if (error) throw error;

    // Immediately send a notification to the reporter
    await triggerNotification(
      user.id,
      null,
      'report',
      promptId,
      `Your report against prompt (ID: ${promptId.substring(0, 8)}...) for "${reason}" has been submitted successfully.`
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting prompt report:', error);
    return { success: false, error: error.message || 'Failed to submit prompt report.' };
  }
}

/**
 * Asserts that the current user is authenticated and not suspended or permanently banned.
 */
export async function assertNotSuspendedOrBanned(userId?: string) {
  const supabase = await createClient();
  let targetId = userId;
  
  if (!targetId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");
    targetId = user.id;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', targetId)
    .single();

  const role = profile?.role || 'user';
  if (role === 'suspended' || role === 'permanently_banned' || role === 'banned') {
    throw new Error("Action blocked: Your account is suspended or permanently banned.");
  }
}
