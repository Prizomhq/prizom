import ExploreClient from '@/components/explore/ExploreClient';
import { createClient } from '@/lib/supabase/server';
import { getPlatformCategoriesAndTools } from '@/app/actions/adminActions';

export const metadata = {
  title: 'Prizom | AI Prompt Discovery Platform',
  description: 'Discover visual prompts by category and model, with infinite scroll discovery.',
};

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;

  const categoryFilter = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;
  const toolFilter = typeof resolvedParams.tool === 'string' ? resolvedParams.tool : undefined;
  const aspectRatioFilter = typeof resolvedParams.aspectRatio === 'string' ? resolvedParams.aspectRatio : undefined;
  const searchQuery = typeof resolvedParams.query === 'string' 
    ? resolvedParams.query 
    : (typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined);

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
