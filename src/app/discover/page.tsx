import ExploreClient from '@/components/explore/ExploreClient';
import { createClient } from '@/lib/supabase/server';
import { getPlatformCategoriesAndTools } from '@/app/actions/adminActions';
import { SITE_CONFIG } from '@/lib/site-config';

export const metadata = {
  title: 'Discover AI Prompts | Prizom',
  description: 'Explore visual prompts by category and model (Midjourney, DALL-E 3, Flux, Stable Diffusion) with interactive parameter deconstruction.',
  alternates: {
    canonical: `${SITE_CONFIG.canonicalBase}/discover`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.canonicalBase}/discover`,
    title: 'Discover AI Prompts | Prizom',
    description: 'Explore visual prompts by category and model with interactive parameter deconstruction.',
    siteName: SITE_CONFIG.name,
    images: [{ url: `${SITE_CONFIG.canonicalBase}${SITE_CONFIG.ogImage}`, width: 1200, height: 630, alt: 'Prizom Discover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover AI Prompts | Prizom',
    description: 'Explore visual prompts by category and model with interactive parameter deconstruction.',
    images: [`${SITE_CONFIG.canonicalBase}${SITE_CONFIG.ogImage}`],
  },
};

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;

  const categoryFilter = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;
  const toolFilter = typeof resolvedParams.tool === 'string' ? resolvedParams.tool : undefined;
  const aspectRatioFilter = typeof resolvedParams.aspectRatio === 'string' ? resolvedParams.aspectRatio : undefined;
  const searchQuery = typeof resolvedParams.query === 'string' 
    ? resolvedParams.query 
    : (typeof resolvedParams.search === 'string' 
       ? resolvedParams.search 
       : (typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined));

  // 1. Fetch categories and tools directories
  const { categories, ai_tools } = await getPlatformCategoriesAndTools();
  
  // 2. Fetch auth user state
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = ['super_admin', 'admin', 'moderator'].includes(currentProfile?.role || '');
  }

  return (
    <ExploreClient 
      categories={categories || []}
      aiTools={ai_tools || []}
      isLoggedIn={!!user}
      isAdmin={isAdmin}
      currentUserId={user?.id}
      activeFilters={{
        query: searchQuery,
        category: categoryFilter,
        tool: toolFilter,
        aspectRatio: aspectRatioFilter
      }}
    />
  );
}
