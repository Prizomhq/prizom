'use server';

import { createClient } from '@/lib/supabase/server';
import { getPublicCMS } from './adminActions';
import { getBlockedUserIdsFilter } from './moderation';
import { getEffectiveHiddenPromptIds } from './hiddenActions';

export interface UserInterests {
  categories?: Record<string, number>;
  tools?: Record<string, number>;
  aspectRatios?: Record<string, number>;
  tags?: Record<string, number>;
  creators?: Record<string, number>;
  searches?: string[];
}

const SIMILAR_CATEGORIES: Record<string, string[]> = {
  'anime': ['concept-art', 'fantasy', 'character-design'],
  'cinematic': ['realistic', 'concept-art', 'sci-fi', 'cyberpunk', 'landscape'],
  'realistic': ['cinematic', 'portrait', 'product-photography', 'landscape', 'architecture'],
  'fantasy': ['anime', 'concept-art', 'character-design', '3d-render'],
  'portrait': ['realistic', 'fashion', 'character-design'],
  'character-design': ['anime', 'fantasy', 'portrait', 'concept-art'],
  'fashion': ['portrait', 'product-photography'],
  'product-photography': ['realistic', 'fashion', 'logo-design'],
  'architecture': ['landscape', 'realistic', '3d-render'],
  'landscape': ['architecture', 'realistic', 'cinematic'],
  'sci-fi': ['cyberpunk', 'cinematic', 'concept-art', '3d-render'],
  'cyberpunk': ['sci-fi', 'cinematic', 'concept-art', '3d-render'],
  'concept-art': ['anime', 'fantasy', 'character-design', 'sci-fi', 'cyberpunk', '3d-render'],
  'logo-design': ['product-photography', '3d-render'],
  '3d-render': ['concept-art', 'fantasy', 'cyberpunk', 'sci-fi', 'architecture', 'logo-design']
};

function getMaxSimilarWeight(category: string, userCategories: Record<string, number>): number {
  const catKey = category.toLowerCase().replace(/\s+/g, '-');
  const similarList = SIMILAR_CATEGORIES[catKey] || [];
  let maxWeight = 0;
  for (const sim of similarList) {
    const weight = userCategories[sim] || 
                   userCategories[sim.replace(/-/g, ' ')] || 
                   userCategories[sim.toLowerCase()] || 
                   userCategories[sim.replace(/-/g, ' ').toLowerCase()] || 
                   0;
    if (weight > maxWeight) {
      maxWeight = weight;
    }
  }
  return maxWeight;
}

export async function fetchRecommendedPrompts(params: {
  page?: number;
  limit?: number;
  interests?: UserInterests;
  filters?: {
    query?: string;
    category?: string;
    tool?: string;
    aspectRatio?: string;
  };
}) {
  const page = params.page || 0;
  const limit = params.limit || 12;
  const interests = params.interests || {};
  const filters = params.filters || {};
  
  const supabase = await createClient();

  // 1. Get authenticated context to filter blocked users
  const { data: { session } } = await supabase.auth.getSession();

  // 2. Fetch CMS configs for banned/hidden filters
  const { hiddenPrompts, bannedUsers } = await getPublicCMS();

  let query = supabase
    .from('prompts')
    .select('*, profiles!user_id!inner(username, full_name, avatar_url, role, badges), remix_of, remix_count')
    .not('profiles.role', 'in', '(suspended,banned,permanently_banned,disabled)')
    .eq('profiles.is_deactivated', false)
    .eq('profiles.pending_deletion', false);

  const filterIds = new Set<string>();

  // Add standard blocked users
  if (session?.user) {
    const blockedIds = await getBlockedUserIdsFilter();
    blockedIds.forEach(id => filterIds.add(id));
  }

  // Add banned users from admin store
  if (bannedUsers && bannedUsers.length > 0) {
    bannedUsers.forEach((id: string) => filterIds.add(id));
  }

  if (filterIds.size > 0) {
    query = query.not('user_id', 'in', `(${Array.from(filterIds).join(',')})`);
  }

  // Exclude user/cookie self-hidden prompts
  const userHiddenIds = await getEffectiveHiddenPromptIds();
  if (userHiddenIds.length > 0) {
    query = query.not('id', 'in', `(${userHiddenIds.join(',')})`);
  }

  // Hybrid fetch: trending prompts + recent prompts to solve cold-start stagnation.
  // Without this, new prompts with 0 likes would never appear in recommendations.
  const [trendingRes, recentRes] = await Promise.all([
    query
      .order('likes_count', { ascending: false })
      .limit(150),
    supabase
      .from('prompts')
      .select('*, profiles!user_id!inner(username, full_name, avatar_url, role, badges), remix_of, remix_count')
      .not('profiles.role', 'in', '(suspended,banned,permanently_banned,disabled)')
      .eq('profiles.is_deactivated', false)
      .eq('profiles.pending_deletion', false)
      .order('created_at', { ascending: false })
      .limit(150)
  ]);

  if (trendingRes.error && recentRes.error) {
    console.error('Error fetching prompts for recommendations:', trendingRes.error, recentRes.error);
    return { prompts: [], hasMore: false };
  }

  // Merge and deduplicate by prompt ID
  const seenIds = new Set<string>();
  const mergedPrompts: any[] = [];
  for (const p of [...(trendingRes.data || []), ...(recentRes.data || [])]) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      mergedPrompts.push(p);
    }
  }

  // Apply exclusion filters to the merged set
  const allFilterIds = Array.from(filterIds);
  const prompts = mergedPrompts.filter(p => {
    if (allFilterIds.length > 0 && allFilterIds.includes(p.user_id)) return false;
    if (userHiddenIds.length > 0 && userHiddenIds.includes(p.id)) return false;
    if (filters.category && filters.category !== 'All' && p.category !== filters.category) return false;
    if (filters.tool && p.ai_tool !== filters.tool) return false;
    if (filters.aspectRatio && p.aspect_ratio !== filters.aspectRatio) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const titleMatch = (p.title || '').toLowerCase().includes(q);
      const descMatch = (p.description || '').toLowerCase().includes(q);
      const toolMatch = (p.ai_tool || '').toLowerCase().includes(q);
      if (!titleMatch && !descMatch && !toolMatch) return false;
    }
    return true;
  });

  if (!prompts || prompts.length === 0) {
    return { prompts: [], hasMore: false };
  }

  // 3. Score each prompt
  const scoredPrompts = prompts.map(prompt => {
    let score = 0;

    // A. Base engagement score
    const likes = prompt.likes_count || 0;
    const saves = prompt.saves_count || 0;
    const copies = prompt.copies_count || 0;
    const remixes = prompt.remix_count || 0;
    const views = prompt.views_count || 0;
    score += (likes * 2.0) + (saves * 3.0) + (copies * 4.0) + (remixes * 5.0) + (views * 0.1);

    // B. Recency boost (created_at)
    const ageInMs = Date.now() - new Date(prompt.created_at).getTime();
    const ageInHours = ageInMs / (1000 * 60 * 60);
    if (ageInHours < 24) {
      score += 150;
    } else if (ageInHours < 24 * 7) {
      score += 75;
    } else if (ageInHours < 24 * 30) {
      score += 30;
    }

    // C. User Interests Boost
    // Category match
    if (interests.categories && prompt.category) {
      const catWeight = interests.categories[prompt.category.toLowerCase()] || interests.categories[prompt.category] || 0;
      score += catWeight * 40;

      // Secondary similar category boost
      const maxSimilarWeight = getMaxSimilarWeight(prompt.category, interests.categories);
      score += maxSimilarWeight * 20;
    }
    // Tool match
    if (interests.tools && prompt.ai_tool) {
      const toolWeight = interests.tools[prompt.ai_tool.toLowerCase()] || interests.tools[prompt.ai_tool] || 0;
      score += toolWeight * 30;
    }
    // Aspect Ratio match
    if (interests.aspectRatios && prompt.aspect_ratio) {
      const ratioWeight = interests.aspectRatios[prompt.aspect_ratio] || 0;
      score += ratioWeight * 20;
    }
    // Creator match
    if (interests.creators && prompt.profiles?.username) {
      const creatorWeight = interests.creators[prompt.profiles.username] || 0;
      score += creatorWeight * 40;
    }
    // Tag match
    if (interests.tags && prompt.tags && prompt.tags.length > 0) {
      prompt.tags.forEach((tag: string) => {
        const tagWeight = interests.tags?.[tag.toLowerCase()] || interests.tags?.[tag] || 0;
        score += tagWeight * 15;
      });
    }

    // D. Query match boost (matching searchPrizom ranking logic)
    if (filters.query && prompt.title) {
      const cleanQuery = filters.query.trim().toLowerCase();
      const titleLower = prompt.title.toLowerCase();
      const tagsLower = ((prompt.tags || []) as string[]).map((t: string) => t.toLowerCase());
      const aiToolLower = (prompt.ai_tool || '').toLowerCase();

      if (titleLower === cleanQuery) score += 10000;
      else if (titleLower.startsWith(cleanQuery)) score += 5000;
      else if (titleLower.includes(cleanQuery)) score += 2000;

      if (tagsLower.some((t: string) => t === cleanQuery)) score += 3000;
      else if (tagsLower.some((t: string) => t.includes(cleanQuery))) score += 1000;

      if (aiToolLower.includes(cleanQuery)) score += 500;
    }

    return { prompt, score };
  });

  // Sort by score descending
  scoredPrompts.sort((a, b) => b.score - a.score);

  // Paginate
  const startIndex = page * limit;
  const endIndex = startIndex + limit;
  const paginatedPrompts = scoredPrompts.slice(startIndex, endIndex).map(sp => sp.prompt);
  const hasMore = endIndex < scoredPrompts.length;

  return {
    prompts: paginatedPrompts,
    hasMore
  };
}

export async function fetchRelatedPrompts(params: {
  promptId: string;
  page?: number;
  limit?: number;
  interests?: UserInterests;
}) {
  const promptId = params.promptId;
  const page = params.page || 0;
  const limit = params.limit || 8;
  const interests = params.interests || {};

  const supabase = await createClient();

  // 1. Fetch target prompt
  const { data: targetPrompt, error: targetError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', promptId)
    .single();

  if (targetError || !targetPrompt) {
    console.error('Error fetching target prompt for similarity:', targetError);
    return { prompts: [], hasMore: false };
  }

  // 2. Fetch all other prompts (excluding target prompt, hidden prompts, banned users' prompts)
  const { hiddenPrompts, bannedUsers } = await getPublicCMS();

  let query = supabase
    .from('prompts')
    .select('*, profiles!user_id!inner(username, full_name, avatar_url, role, badges), remix_of, remix_count')
    .neq('id', promptId)
    .not('profiles.role', 'in', '(suspended,banned,permanently_banned,disabled)');

  const filterIds = new Set<string>();
  if (bannedUsers && bannedUsers.length > 0) {
    bannedUsers.forEach((id: string) => filterIds.add(id));
  }

  if (filterIds.size > 0) {
    query = query.not('user_id', 'in', `(${Array.from(filterIds).join(',')})`);
  }

  const userHiddenIds = await getEffectiveHiddenPromptIds();
  if (userHiddenIds.length > 0) {
    query = query.not('id', 'in', `(${userHiddenIds.join(',')})`);
  }

  if (targetPrompt.category) {
    query = query.eq('category', targetPrompt.category);
  }
  const { data: prompts, error } = await query.limit(100);

  if (error || !prompts) {
    console.error('Error fetching other prompts for similarity:', error);
    return { prompts: [], hasMore: false };
  }

  // 3. Score each prompt's similarity
  const targetTags = targetPrompt.tags || [];
  const targetCategory = targetPrompt.category || '';
  const targetTool = targetPrompt.ai_tool || '';
  const targetRatio = targetPrompt.aspect_ratio || '1:1';
  const targetCreator = targetPrompt.user_id;

  const scoredPrompts = prompts.map(prompt => {
    let similarityScore = 0;

    // A. Metadata Similarity
    // Category match
    if (prompt.category && prompt.category === targetCategory) {
      similarityScore += 100;
    }
    // Tool match
    if (prompt.ai_tool && prompt.ai_tool === targetTool) {
      similarityScore += 80;
    }
    // Aspect ratio match
    if (prompt.aspect_ratio && prompt.aspect_ratio === targetRatio) {
      similarityScore += 50;
    }
    // Creator similarity (same creator)
    if (prompt.user_id === targetCreator) {
      similarityScore += 120;
    }
    // Tags overlap
    const promptTags = prompt.tags || [];
    const overlappingTags = promptTags.filter((t: string) => targetTags.includes(t));
    similarityScore += overlappingTags.length * 40;

    // B. User Preference Boost (personalization inside related feed)
    if (interests.categories && prompt.category) {
      const catWeight = interests.categories[prompt.category.toLowerCase()] || interests.categories[prompt.category] || 0;
      similarityScore += catWeight * 40;

      // Secondary similar category boost
      const maxSimilarWeight = getMaxSimilarWeight(prompt.category, interests.categories);
      similarityScore += maxSimilarWeight * 20;
    }
    if (interests.tools && prompt.ai_tool) {
      similarityScore += (interests.tools[prompt.ai_tool.toLowerCase()] || 0) * 8;
    }

    return { prompt, score: similarityScore };
  });

  // Sort by similarity score descending
  scoredPrompts.sort((a, b) => b.score - a.score);

  // Paginate
  const startIndex = page * limit;
  const endIndex = startIndex + limit;
  const paginatedPrompts = scoredPrompts.slice(startIndex, endIndex).map(sp => sp.prompt);
  const hasMore = endIndex < scoredPrompts.length;

  return {
    prompts: paginatedPrompts,
    hasMore
  };
}
