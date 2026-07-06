'use server';

import { createClient } from '@/lib/supabase/server';
import { getBlockedUserIdsFilter } from './moderation';
import { getPublicCMS } from './adminActions';
import { getEffectiveHiddenPromptIds } from './hiddenActions';

export async function getTrendingData(timeframe: 'Today' | 'This Week' | 'This Month' | 'All Time') {
  const supabase = await createClient();

  // 1. Calculate the precise timeframe cutoff
  let dateCutoff: string = new Date(0).toISOString(); // Default to beginning of time
  const now = new Date();
  
  if (timeframe === 'Today') {
    now.setHours(now.getHours() - 24);
    dateCutoff = now.toISOString();
  } else if (timeframe === 'This Week') {
    now.setDate(now.getDate() - 7);
    dateCutoff = now.toISOString();
  } else if (timeframe === 'This Month') {
    now.setMonth(now.getMonth() - 1);
    dateCutoff = now.toISOString();
  }

  // hiddenPrompts removed (handled by DB)
  const { data: { user } } = await supabase.auth.getUser();

  // 2. P1-3: Attempt to read from the trending_prompts_cache table first (O(1) read).
  //    The cache is populated by the cron job via refresh_trending_prompts_cache().
  //    Fall back to the live aggregation RPC only if the cache is empty.
  let prompts: any[] | null = null;

  try {
    const { data: cached, error: cacheErr } = await supabase
      .from('trending_prompts_cache')
      .select('*')
      .eq('timeframe', timeframe)
      .order('trend_score', { ascending: false })
      .limit(100);

    if (!cacheErr && cached && cached.length > 0) {
      // Cache hit — use it directly
      prompts = cached.map((r: any) => ({
        prompt_id: r.prompt_id,
        title: r.title,
        image_url: r.image_url,
        ai_tool: r.ai_tool,
        category: r.category,
        user_id: r.user_id,
        created_at: r.created_at,
        username: r.username,
        full_name: r.full_name,
        avatar_url: r.avatar_url,
        badges: r.badges,
        likes_count_total: r.likes_count_total,
        copies_count_total: r.copies_count_total,
        remix_count_total: r.remix_count_total,
        remix_of: r.remix_of,
        trend_score: r.trend_score
      }));
    }
  } catch (cacheReadErr) {
    console.warn('[TRENDING] Cache read failed, falling back to live RPC:', cacheReadErr);
  }

  // Cache miss or cache empty — call the live aggregation RPC
  if (!prompts) {
    const { data: liveData, error } = await supabase
      .rpc('get_trending_prompts', { cutoff_timestamp: dateCutoff });

    if (error) {
      console.error('Error fetching trending data RPC:', error.message || error);
      return { prompts: [], remixes: [] };
    }
    prompts = liveData;
  }

  // 3. Filter blocked creators and hidden prompts in JS memory
  let blockedIds: string[] = [];
  let isAdmin = false;

  if (user) {
    blockedIds = await getBlockedUserIdsFilter();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = ['super_admin', 'admin', 'moderator'].includes(profile?.role || '');
  }

  // Fetch roles of all unique user_ids to filter out suspended/banned/disabled accounts
  const userIds = Array.from(new Set((prompts || []).map((p: any) => p.user_id)));
  const suspendedUserIds = new Set<string>();

  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, role, is_deactivated, pending_deletion')
      .in('id', userIds);
    (profilesData || []).forEach((u: any) => {
      if (
        ['suspended', 'banned', 'permanently_banned', 'disabled'].includes(u.role || '') ||
        u.is_deactivated || u.pending_deletion
      ) {
        suspendedUserIds.add(u.id);
      }
    });
  }

  const userHiddenIds = await getEffectiveHiddenPromptIds();
  const allHidden = new Set(userHiddenIds);
  const blockedSet = new Set(blockedIds);

  const formattedScoredPrompts = (prompts || [])
    .filter((p: any) => !blockedSet.has(p.user_id) && !allHidden.has(p.prompt_id) && (isAdmin || !suspendedUserIds.has(p.user_id)))
    .map((p: any) => ({
      id: p.prompt_id,
      title: p.title,
      image_url: p.image_url,
      ai_tool: p.ai_tool,
      category: p.category,
      user_id: p.user_id,
      created_at: p.created_at,
      likes_count: p.likes_count_total,
      copies_count: p.copies_count_total,
      remix_count: p.remix_count_total,
      remix_of: p.remix_of,
      profiles: {
        username: p.username,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        badges: p.badges
      },
      trendScore: p.trend_score,
      aspect_ratio: p.aspect_ratio || '1:1',
      image_width: p.image_width || null,
      image_height: p.image_height || null
    }));

  // Fetch true aspect ratios and image dimensions from the prompts table
  const promptIds = formattedScoredPrompts.map(p => p.id);
  if (promptIds.length > 0) {
    const { data: dims } = await supabase
      .from('prompts')
      .select('id, aspect_ratio, image_width, image_height')
      .in('id', promptIds);
      
    if (dims && dims.length > 0) {
      const dimMap = new Map(dims.map(d => [d.id, d]));
      formattedScoredPrompts.forEach(p => {
        const d = dimMap.get(p.id);
        if (d) {
          p.aspect_ratio = d.aspect_ratio || '1:1';
          p.image_width = d.image_width || null;
          p.image_height = d.image_height || null;
        }
      });
    }
  }

  // 4. Split into Prompts and Remixes
  const trendingPrompts = formattedScoredPrompts.filter((p: any) => !p.remix_of).slice(0, 30);
  const trendingRemixes = formattedScoredPrompts.filter((p: any) => p.remix_of).slice(0, 15);

  return {
    prompts: trendingPrompts,
    remixes: trendingRemixes
  };
}
export type TrendingTimeframe = 'Today' | 'This Week' | 'This Month' | 'All Time';
