import { getTrendingData } from '@/app/actions/trending';
import TrendingPageClient from '@/app/trending/TrendingPageClient';

export const revalidate = 3600; // Revalidate cache every hour for trending

export default async function TrendingPage() {
  // Pre-fetch 'This Week' on the server for instant page load & solid SEO
  const initialData = await getTrendingData('This Week');

  return (
    <TrendingPageClient 
      initialPrompts={initialData.prompts} 
      initialRemixes={initialData.remixes} 
    />
  );
}
