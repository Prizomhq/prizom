'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function getPlatformStats() {
  const supabase = await createClient();

  try {
    // 1. Try fetching from the database RPC for high performance
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_platform_stats');

    if (!rpcError && rpcData && rpcData.length > 0) {
      const stats = rpcData[0];
      return {
        success: true,
        stats: {
          totalPrompts: Number(stats.total_prompts) || 0,
          activeCreators: Number(stats.active_creators) || 0,
          remixCount: Number(stats.remix_count) || 0,
          dailyUploads: Number(stats.daily_uploads) || 0,
          totalCollections: Number(stats.total_collections) || 0,
          totalLikes: Number(stats.total_likes) || 0
        }
      };
    }

    // 2. Fallback to optimized count queries if RPC is not available
    const { count: totalPrompts } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'active');

    const { data: creatorsData } = await supabase
      .from('prompts')
      .select('user_id')
      .eq('moderation_status', 'active');
    const activeCreators = new Set((creatorsData || []).map(p => p.user_id)).size;

    const { count: remixCount } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .not('remix_of', 'is', null)
      .eq('moderation_status', 'active');

    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    const { count: dailyUploads } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'active')
      .gte('created_at', oneDayAgo.toISOString());

    // Query collections instead of legacy saves table
    const { count: totalCollections } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true });

    const { count: totalLikes } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true });

    return {
      success: true,
      stats: {
        totalPrompts: totalPrompts || 0,
        activeCreators: activeCreators || 0,
        remixCount: remixCount || 0,
        dailyUploads: dailyUploads || 0,
        totalCollections: totalCollections || 0,
        totalLikes: totalLikes || 0
      }
    };
  } catch (err: any) {
    console.error('Error fetching platform stats:', err);
    // Graceful fallback to default mock stats if database is empty or offline
    return {
      success: false,
      stats: {
        totalPrompts: 142,
        activeCreators: 28,
        remixCount: 45,
        dailyUploads: 12,
        totalCollections: 18,
        totalLikes: 890
      }
    };
  }
}

export async function getPromptLineageStats(promptId: string) {
  const supabase = await createClient();

  try {
    // First, find the prompt's original_root_id from prompts or archived_prompts
    let rootId = promptId;
    const { data: activePrompt } = await supabase
      .from('prompts')
      .select('original_root_id')
      .eq('id', promptId)
      .maybeSingle();

    if (activePrompt) {
      rootId = activePrompt.original_root_id || promptId;
    } else {
      const { data: archivedPrompt } = await supabase
        .from('archived_prompts')
        .select('original_root_id')
        .eq('id', promptId)
        .maybeSingle();
      if (archivedPrompt) {
        rootId = archivedPrompt.original_root_id || promptId;
      }
    }

    // Total Descendants: direct and indirect children sharing the same original_root_id
    // Excluding the root prompt itself.
    const { count: totalDescendants } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('original_root_id', rootId)
      .neq('id', rootId);

    const { count: archivedDescendants } = await supabase
      .from('archived_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('original_root_id', rootId)
      .neq('id', rootId);

    // Surviving Lineage Count: active descendant variations (in prompts where moderation_status = 'active')
    const { count: survivingCount } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('original_root_id', rootId)
      .neq('id', rootId)
      .eq('moderation_status', 'active');

    return {
      success: true,
      stats: {
        totalDescendants: (totalDescendants || 0) + (archivedDescendants || 0),
        survivingCount: survivingCount || 0,
        originalRootId: rootId
      }
    };
  } catch (err: any) {
    console.error('Error fetching prompt lineage stats:', err);
    return {
      success: false,
      stats: {
        totalDescendants: 0,
        survivingCount: 0,
        originalRootId: promptId
      }
    };
  }
}

export async function getCreatorAnalyticsAction(timeframe: '7d' | '30d' | '90d' | 'all') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const adminClient = await createAdminClient();

  // Calculate start date
  let startDate = new Date(0); // All time
  const now = new Date();
  if (timeframe === '7d') startDate = new Date(now.setDate(now.getDate() - 7));
  else if (timeframe === '30d') startDate = new Date(now.setDate(now.getDate() - 30));
  else if (timeframe === '90d') startDate = new Date(now.setDate(now.getDate() - 90));
  const startIso = startDate.toISOString();

  try {
    // Get creator's prompts
    const { data: prompts } = await adminClient
      .from('prompts')
      .select('id')
      .eq('user_id', user.id);

    const promptIds = prompts?.map(p => p.id) || [];
    if (promptIds.length === 0) {
      return { success: true, stats: { followers: 0, copies: 0, likes: 0, views: 0 } };
    }

    // Run parallel count queries
    const [copiesRes, viewsRes, likesRes, followersRes] = await Promise.all([
      adminClient.from('prompt_copy_logs').select('id', { count: 'exact', head: true }).in('prompt_id', promptIds).gte('copied_at', startIso),
      adminClient.from('prompt_views').select('id', { count: 'exact', head: true }).in('prompt_id', promptIds).gte('viewed_at', startIso),
      adminClient.from('likes').select('id', { count: 'exact', head: true }).in('prompt_id', promptIds).gte('created_at', startIso),
      adminClient.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', user.id).gte('created_at', startIso)
    ]);

    return {
      success: true,
      stats: {
        followers: followersRes.count || 0,
        copies: copiesRes.count || 0,
        likes: likesRes.count || 0,
        views: viewsRes.count || 0
      }
    };
  } catch (err: any) {
    console.error('Failed to query timeframe analytics:', err);
    return { success: false, error: err.message };
  }
}

