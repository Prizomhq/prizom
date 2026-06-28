'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { triggerNotification } from './notifications';

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  badgeIcon: string;
  earnedAt: string;
}

/**
 * Checks if a specific achievement is unlocked for a user, and if not, unlocks it.
 */
export async function checkAndUnlockAchievement(userId: string, achievementId: string) {
  const supabase = await createAdminClient();

  try {
    // 1. Check if already unlocked
    const { data: existing, error: checkError } = await supabase
      .from('user_achievements')
      .select('id')
      .match({ user_id: userId, achievement_id: achievementId })
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) return { success: true, unlocked: false };

    // 2. Fetch achievement details
    const { data: achievement, error: achError } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievementId)
      .single();

    if (achError || !achievement) throw new Error('Achievement details not found');

    // 3. Unlock achievement
    const { error: insertError } = await supabase
      .from('user_achievements')
      .insert([{ user_id: userId, achievement_id: achievementId }]);

    if (insertError) {
      if (insertError.code === '23505') {
        return { success: true, unlocked: false };
      }
      throw insertError;
    }

    // 4. Trigger alert notification for user
    await triggerNotification(
      userId,
      null, // System notification
      'achievement',
      null,
      `🎉 Unlocked Badge: "${achievement.title}" ${achievement.badge_icon} - ${achievement.description}`
    );

    return { success: true, unlocked: true, title: achievement.title };
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return { success: false, error };
  }
}

/**
 * Recalculate achievements for all profiles (if admin) or for the logged-in user.
 */
export async function recalculateAchievementsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, username')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'user';
  const isAdmin = ['super_admin', 'admin', 'moderator'].includes(role);

  const adminClient = await createAdminClient();

  let targetProfiles: { id: string; username: string }[] = [];
  if (isAdmin) {
    const { data: allProfiles, error: fetchErr } = await adminClient
      .from('profiles')
      .select('id, username');
    if (fetchErr) {
      return { success: false, error: fetchErr.message };
    }
    targetProfiles = allProfiles || [];
  } else {
    targetProfiles = [{ id: user.id, username: profile?.username || '' }];
  }

  // Fetch trending data once for 'trending_prompt'
  const trendingPromptIds = new Set<string>();
  try {
    const { getTrendingData } = await import('./trending');
    const trendingData = await getTrendingData('This Week');
    (trendingData.prompts || []).forEach((p: any) => trendingPromptIds.add(p.id));
    (trendingData.remixes || []).forEach((p: any) => trendingPromptIds.add(p.id));
  } catch (err) {
    console.error('Error fetching trending data during recalculation:', err);
  }

  let processed = 0;
  let unlockedCount = 0;

  // Batch query all prompt metrics per creator
  const { data: promptsMetrics } = await adminClient
    .from('prompts')
    .select('id, user_id, likes_count, saves_count, remix_of');

  const userMetrics: Record<string, { promptsCount: number; remixCount: number; likesCount: number; savesCount: number; promptIds: string[] }> = {};
  promptsMetrics?.forEach((p: any) => {
    const uid = p.user_id;
    if (!userMetrics[uid]) {
      userMetrics[uid] = { promptsCount: 0, remixCount: 0, likesCount: 0, savesCount: 0, promptIds: [] };
    }
    userMetrics[uid].promptsCount++;
    userMetrics[uid].likesCount += (p.likes_count || 0);
    userMetrics[uid].savesCount += (p.saves_count || 0);
    userMetrics[uid].promptIds.push(p.id);
    if (p.remix_of) {
      userMetrics[uid].remixCount++;
    }
  });

  for (const target of targetProfiles) {
    const userId = target.id;
    const metrics = userMetrics[userId] || { promptsCount: 0, remixCount: 0, likesCount: 0, savesCount: 0, promptIds: [] };

    // 1. Pioneer Upload (first_upload)
    if (metrics.promptsCount >= 1) {
      const res = await checkAndUnlockAchievement(userId, 'first_upload');
      if (res.success && res.unlocked) unlockedCount++;
    }

    // 2. Dynamic Remix (first_remix)
    if (metrics.remixCount >= 1) {
      const res = await checkAndUnlockAchievement(userId, 'first_remix');
      if (res.success && res.unlocked) unlockedCount++;
    }

    // 3. Rising Star (ten_likes)
    if (metrics.likesCount >= 10) {
      const res = await checkAndUnlockAchievement(userId, 'ten_likes');
      if (res.success && res.unlocked) unlockedCount++;
    }

    // 4. Community Choice (community_favorite)
    if (metrics.savesCount >= 5) {
      const res = await checkAndUnlockAchievement(userId, 'community_favorite');
      if (res.success && res.unlocked) unlockedCount++;
    }

    // 5. Velocity Champ (trending_prompt)
    if (trendingPromptIds.size > 0 && metrics.promptIds.length > 0) {
      const hasTrending = metrics.promptIds.some(pid => trendingPromptIds.has(pid));
      if (hasTrending) {
        const res = await checkAndUnlockAchievement(userId, 'trending_prompt');
        if (res.success && res.unlocked) unlockedCount++;
      }
    }

    processed++;
  }

  return { success: true, processed, unlockedCount };
}

/**
 * Fetch achievements earned by a specific creator.
 */
export async function getUserAchievements(userId: string): Promise<AchievementItem[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('created_at, achievements(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.achievements.id,
      title: item.achievements.title,
      description: item.achievements.description,
      badgeIcon: item.achievements.badge_icon,
      earnedAt: item.created_at
    })) || [];
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
}

/**
 * Automatically triggers validation rules to check if the creator qualifies for any new badges.
 * Called inside other server actions (like, follow, save, upload).
 */
export async function triggerAchievementCheck(userId: string, eventType: 'upload' | 'remix' | 'like' | 'save' | 'trending') {
  const supabase = await createClient();

  try {
    if (eventType === 'upload') {
      // Check upload counts
      const { count } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (count && count >= 1) {
        await checkAndUnlockAchievement(userId, 'first_upload');
      }
    } 
    
    else if (eventType === 'remix') {
      // Check if user has uploaded a remix
      const { count } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('remix_of', 'is', null);

      if (count && count >= 1) {
        await checkAndUnlockAchievement(userId, 'first_remix');
      }
    } 
    
    else if (eventType === 'like') {
      // Sum all likes gathered across prompts created by this user
      const { data: prompts } = await supabase
        .from('prompts')
        .select('likes_count')
        .eq('user_id', userId);

      const totalLikes = prompts?.reduce((acc, p) => acc + (p.likes_count || 0), 0) || 0;

      if (totalLikes >= 10) {
        await checkAndUnlockAchievement(userId, 'ten_likes');
      }
    } 
    
    else if (eventType === 'save') {
      // Sum all saves gathered across prompts created by this user
      const { data: prompts } = await supabase
        .from('prompts')
        .select('saves_count')
        .eq('user_id', userId);

      const totalSaves = prompts?.reduce((acc, p) => acc + (p.saves_count || 0), 0) || 0;

      if (totalSaves >= 5) {
        await checkAndUnlockAchievement(userId, 'community_favorite');
      }
    }
    
    else if (eventType === 'trending') {
      // Check if user has any prompts on the trending leaderboard
      const { getTrendingData } = await import('./trending');
      const trendingData = await getTrendingData('This Week');

      // Fetch user's prompts
      const { data: userPrompts } = await supabase
        .from('prompts')
        .select('id')
        .eq('user_id', userId);

      if (userPrompts && userPrompts.length > 0) {
        const userPromptIdSet = new Set(userPrompts.map(p => p.id));
        const hasTrending = 
          (trendingData.prompts || []).some((p: any) => userPromptIdSet.has(p.id)) ||
          (trendingData.remixes || []).some((p: any) => userPromptIdSet.has(p.id));

        if (hasTrending) {
          await checkAndUnlockAchievement(userId, 'trending_prompt');
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to run achievement checks:', error);
    return { success: false };
  }
}
