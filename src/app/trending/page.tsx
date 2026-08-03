import { getTrendingData } from '@/app/actions/trending';
import TrendingPageClient from '@/app/trending/TrendingPageClient';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site-config';

export const revalidate = 3600; // Revalidate cache every hour for trending

export const metadata: Metadata = {
  title: 'Trending AI Prompts | Prizom',
  description: 'Explore the most popular and highly remixed AI image prompts on Prizom. Copy configurations and build on community masterpieces.',
  alternates: {
    canonical: `${SITE_CONFIG.canonicalBase}/trending`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.canonicalBase}/trending`,
    title: 'Trending AI Prompts | Prizom',
    description: 'Explore the most popular and highly remixed AI image prompts on Prizom.',
    siteName: SITE_CONFIG.name,
    images: [{ url: `${SITE_CONFIG.canonicalBase}${SITE_CONFIG.ogImage}`, width: 1200, height: 630, alt: 'Prizom Trending' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trending AI Prompts | Prizom',
    description: 'Explore the most popular and highly remixed AI image prompts on Prizom.',
    images: [`${SITE_CONFIG.canonicalBase}${SITE_CONFIG.ogImage}`],
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
