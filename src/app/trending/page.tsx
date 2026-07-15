import { getTrendingData } from '@/app/actions/trending';
import TrendingPageClient from '@/app/trending/TrendingPageClient';
import { Metadata } from 'next';

export const revalidate = 3600; // Revalidate cache every hour for trending

export const metadata: Metadata = {
  title: 'Trending AI Prompts | Prizom',
  description: 'Explore the most popular and highly remixed AI image prompts on Prizom. Copy configurations and build on community masterpieces.',
  alternates: {
    canonical: 'https://www.prizom.in/trending',
  },
};

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
