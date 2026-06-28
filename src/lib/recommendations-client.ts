'use client';

export interface UserInterests {
  categories: Record<string, number>;
  tools: Record<string, number>;
  aspectRatios: Record<string, number>;
  tags: Record<string, number>;
  creators: Record<string, number>;
  searches: string[];
}

const STORAGE_KEY = 'prizom_interests_v2';

const DEFAULT_INTERESTS: UserInterests = {
  categories: {},
  tools: {},
  aspectRatios: {},
  tags: {},
  creators: {},
  searches: []
};

export function getUserInterests(): UserInterests {
  if (typeof window === 'undefined') return DEFAULT_INTERESTS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INTERESTS));
      return DEFAULT_INTERESTS;
    }
    const parsed = JSON.parse(data);
    return {
      categories: parsed.categories || {},
      tools: parsed.tools || {},
      aspectRatios: parsed.aspectRatios || {},
      tags: parsed.tags || {},
      creators: parsed.creators || {},
      searches: parsed.searches || []
    };
  } catch (e) {
    console.error('Error reading user interests:', e);
    return DEFAULT_INTERESTS;
  }
}

export function saveUserInterests(interests: UserInterests) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interests));
  } catch (e) {
    console.error('Error saving user interests:', e);
  }
}

export function trackUserActivity(
  type: 'like' | 'save' | 'copy' | 'remix' | 'view' | 'search' | 'category' | 'tool' | 'ratio',
  details: {
    category?: string;
    tool?: string;
    aspectRatio?: string;
    tags?: string[];
    creator?: string;
    query?: string;
  }
) {
  if (typeof window === 'undefined') return;

  const interests = getUserInterests();

  // Define weights based on action type
  const weights = {
    like: 3,
    save: 4,
    copy: 5,
    remix: 5,
    view: 2,
    search: 2,
    category: 1,
    tool: 1,
    ratio: 1
  };

  const weight = weights[type] || 1;

  // Track category
  if (details.category) {
    const cat = details.category.toLowerCase().trim();
    interests.categories[cat] = (interests.categories[cat] || 0) + weight;
  }

  // Track tool
  if (details.tool) {
    const tool = details.tool.toLowerCase().trim();
    interests.tools[tool] = (interests.tools[tool] || 0) + weight;
  }

  // Track aspect ratio
  if (details.aspectRatio) {
    const ratio = details.aspectRatio.trim();
    interests.aspectRatios[ratio] = (interests.aspectRatios[ratio] || 0) + weight;
  }

  // Track creator
  if (details.creator) {
    const creator = details.creator.trim();
    interests.creators[creator] = (interests.creators[creator] || 0) + weight;
  }

  // Track tags
  if (details.tags && details.tags.length > 0) {
    details.tags.forEach(t => {
      const tag = t.toLowerCase().trim();
      interests.tags[tag] = (interests.tags[tag] || 0) + (weight * 0.5);
    });
  }

  // Track search query
  if (type === 'search' && details.query) {
    const query = details.query.toLowerCase().trim();
    if (query && !interests.searches.includes(query)) {
      interests.searches.unshift(query);
      // Limit recent searches to 10
      interests.searches = interests.searches.slice(0, 10);
    }
  }

  saveUserInterests(interests);
}
