'use server';

import { createClient } from '@/lib/supabase/server';
import { getBlockedUserIdsFilter } from './moderation';
import { getPublicCMS } from './adminActions';
import { getEffectiveHiddenPromptIds } from './hiddenActions';

export async function searchPrizom(query: string) {
  if (!query.trim()) {
    return { prompts: [], profiles: [], tags: [] };
  }

  const cleanQuery = query.trim().toLowerCase();
  const supabase = await createClient();

  // Sanitize query for PostgREST array containment syntax (tags.cs.{value})
  // Strip characters that break PostgreSQL array literal parsing: {, }, \, "
  const safeTagsQuery = cleanQuery.replace(/[{}\\"]/g, '').trim();

  const { data: { user } } = await supabase.auth.getUser();
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

  // 1. Search prompts — broader field match for better recall
  // Use safeTagsQuery for the array containment filter to prevent PostgREST parser errors
  let promptsQuery = supabase
    .from('prompts')
    .select(
      isAdmin 
        ? 'id, title, image_url, remix_of, remix_count, tags, ai_tool, category, likes_count'
        : 'id, title, image_url, remix_of, remix_count, tags, ai_tool, category, likes_count, profiles!user_id!inner(role, username, full_name)'
    )
    .or(`title.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%,ai_tool.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%${safeTagsQuery ? `,tags.cs.{${safeTagsQuery}}` : ''}`);

  if (blockedIds.length > 0) {
    promptsQuery = promptsQuery.not('user_id', 'in', `(${blockedIds.join(',')})`);
  }

  // Exclude user self-hidden prompts
  const userHiddenIds = await getEffectiveHiddenPromptIds();
  if (userHiddenIds.length > 0) {
    promptsQuery = promptsQuery.not('id', 'in', `(${userHiddenIds.join(',')})`);
  }

  if (!isAdmin) {
    promptsQuery = promptsQuery
      .not('profiles.role', 'in', '(suspended,banned,permanently_banned,disabled)')
      .eq('profiles.is_deactivated', false)
      .eq('profiles.pending_deletion', false);
  }

  // Fetch 20 prompt results, ordered by engagement
  const promptsPromise = promptsQuery
    .order('likes_count', { ascending: false })
    .limit(20);

  // 2. Search creators (matches username or full_name)
  let profilesQuery = supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio, role, follower_count')
    .or(`username.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%`);

  if (blockedIds.length > 0) {
    profilesQuery = profilesQuery.not('id', 'in', `(${blockedIds.join(',')})`);
  }

  if (!isAdmin) {
    profilesQuery = profilesQuery
      .not('role', 'in', '(suspended,banned,permanently_banned,disabled)')
      .eq('is_deactivated', false)
      .eq('pending_deletion', false);
  }

  const profilesPromise = profilesQuery
    .order('follower_count', { ascending: false })
    .limit(5);

  const [promptsRes, profilesRes] = await Promise.all([
    promptsPromise,
    profilesPromise
  ]);

  // 3. Client-side rank prompts: exact title match > tag match > content match > creator match
  const rawPrompts = (promptsRes.data as any[]) || [];
  const rankedPrompts = rawPrompts
    .map(p => {
      const titleLower = (p.title || '').toLowerCase();
      const tagsLower = ((p.tags || []) as string[]).map((t: string) => t.toLowerCase());
      const aiToolLower = (p.ai_tool || '').toLowerCase();

      let score = p.likes_count || 0;

      // Exact title match — highest priority
      if (titleLower === cleanQuery) score += 10000;
      else if (titleLower.startsWith(cleanQuery)) score += 5000;
      else if (titleLower.includes(cleanQuery)) score += 2000;

      // Tag match — second priority
      if (tagsLower.some((t: string) => t === cleanQuery)) score += 3000;
      else if (tagsLower.some((t: string) => t.includes(cleanQuery))) score += 1000;

      // AI tool match
      if (aiToolLower.includes(cleanQuery)) score += 500;

      return { ...p, _searchScore: score };
    })
    .sort((a, b) => b._searchScore - a._searchScore)
    .slice(0, 10);

  // 4. Extract tags from prompt results matching the query
  const allTags = rawPrompts.flatMap((p: any) => p.tags || []);
  const matchedTags = Array.from(
    new Set(
      allTags
        .filter((t: any) => typeof t === 'string' && t.toLowerCase().includes(cleanQuery))
    )
  ).slice(0, 8) as string[];

  return {
    prompts: rankedPrompts,
    profiles: (profilesRes.data as any[]) || [],
    tags: matchedTags
  };
}

