'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ArrowRight, 
  ChevronRight,
  Megaphone,
  Search,
  Zap,
  Layers,
  CheckCircle,
  Image as ImageIcon,
  Copy,
  GitFork,
  Heart
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PrizomLogo from '@/components/ui/PrizomLogo';

interface WhyCard {
  id: string;
  title: string;
  description: string;
}

interface HowStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  visualType: 'discover' | 'remix' | 'create' | 'share';
}

interface LandingPageProps {
  cmsData: {
    homepage: {
      hero_title: string;
      hero_subtitle: string;
      hero_cta_text?: string;
      hero_cta_link?: string;
      hero_bg_images?: string[];
      hero_layout?: 'centered' | 'split';
      announcement: string;
      show_announcement: boolean;
      announcement_cta_text?: string;
      banner_text?: string;
      banner_link: string;
      show_banner: boolean;
      promo_blocks?: Array<{
        id: string;
        title: string;
        content: string;
        link_text?: string;
        link_url?: string;
        style: 'banner' | 'card' | 'feature';
        is_active: boolean;
      }>;
    };
    footer: any;
  };
}



export default function LandingPage({ cmsData }: LandingPageProps) {
  const router = useRouter();
  const { homepage } = cmsData;
  const heroCtaText = homepage.hero_cta_text || 'Discover Prompts';
  const heroCtaLink = homepage.hero_cta_link || '/discover';

  const renderRefinedTitle = (title: string) => {
    const defaultTitle = "Build on Shared AI Image Prompts";
    const currentTitle = title || defaultTitle;
    
    if (currentTitle === defaultTitle || currentTitle === "Discover AI Prompts Worth Saving" || currentTitle === "Create Images Worth Sharing") {
      return (
        <>
          Build on the World's <br className="hidden lg:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-neon-purple)] via-indigo-500 to-[var(--color-electric-blue)]">
            AI Image Prompts
          </span>
        </>
      );
    }

    // Smart gradient highlight for custom titles: highlight last 2 words
    const words = currentTitle.split(' ');
    if (words.length > 2) {
      const mainText = words.slice(0, words.length - 2).join(' ');
      const highlightedText = words.slice(words.length - 2).join(' ');
      return (
        <>
          {mainText} <br className="hidden lg:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-neon-purple)] via-indigo-500 to-[var(--color-electric-blue)]">
            {highlightedText}
          </span>
        </>
      );
    }
    return currentTitle;
  };

  const [realPrompts, setRealPrompts] = useState<any[]>([]);

  // Fetch real prompts from Supabase. If count is high enough (>= 4), we show them.
  useEffect(() => {
    async function fetchRealPrompts() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('prompts')
          .select('*, profiles!user_id(username, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(16);

        if (data && data.length >= 4) {
          setRealPrompts(data);
        }
      } catch (err) {
        console.error('Failed to query real prompts:', err);
      }
    }
    fetchRealPrompts();
  }, []);

  const handleTagClick = (tag: string) => {
    router.push(`/discover?q=${encodeURIComponent(tag)}`);
  };

  // Hero showcase fallback cards
  const heroShowcaseCards = [
    {
      id: 'h-1',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
      title: 'Realistic Portraits',
    },
    {
      id: 'h-2',
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop',
      title: 'Anime Art',
    },
    {
      id: 'h-3',
      image: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&auto=format&fit=crop',
      title: 'Sci-Fi Concept Art',
    },
    {
      id: 'h-4',
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop',
      title: 'Product Advertising',
    },
    {
      id: 'h-5',
      image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop',
      title: 'Fantasy Worlds',
    },
    {
      id: 'h-6',
      image: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=600&auto=format&fit=crop',
      title: 'Cinematic Photography',
    },
    {
      id: 'h-7',
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop',
      title: 'Logo Design',
    }
  ];

  // Pre-configured style showcase cards (for low prompt fallback)
  const inspirationalShowcaseCards = [
    {
      id: 'insp-1',
      title: 'Neon Cyberpunk Cityscape',
      tool: 'Midjourney',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop',
      tag: 'cyberpunk'
    },
    {
      id: 'insp-2',
      title: 'Ghibli-Style Summer Meadow',
      tool: 'Flux',
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop',
      tag: 'anime'
    },
    {
      id: 'insp-3',
      title: 'Hyper-Realistic Studio Portrait',
      tool: 'Flux',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
      tag: 'portrait'
    },
    {
      id: 'insp-4',
      title: 'Minimalist Vector Fox Logo',
      tool: 'Ideogram',
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop',
      tag: 'logo-design'
    },
    {
      id: 'insp-5',
      title: 'Mythical Crystal Cave',
      tool: 'Midjourney',
      image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop',
      tag: 'fantasy'
    },
    {
      id: 'insp-6',
      title: 'Dramatic Film Noir Scene',
      tool: 'Midjourney',
      image: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=600&auto=format&fit=crop',
      tag: 'cinematic'
    },
    {
      id: 'insp-7',
      title: 'Sci-Fi Mech Concept Art',
      tool: 'Flux',
      image: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&auto=format&fit=crop',
      tag: 'sci-fi'
    },
    {
      id: 'insp-8',
      title: 'Sleek Cosmetic Studio Shot',
      tool: 'Flux',
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop',
      tag: 'product-photography'
    }
  ];



  // Why Prizom Cards (Creator Benefits)
  const whyCards: WhyCard[] = [
    { id: 'w-save', title: 'Save AI Image Prompts', description: 'Save your image prompt formulas in one permanent visual registry.' },
    { id: 'w-collections', title: 'Build Visual Styles', description: 'Organize image prompt templates by creative workflows, visual styles, and generator tools.' },
    { id: 'w-remix', title: 'Prompt Remix', description: 'Remix existing templates, adapt visual styles, and automatically link attribution chains.' },
    { id: 'w-styles', title: 'Discover Visual Styles', description: 'Discover curated feeds, trending visual styles, and image creation workflows.' },
    { id: 'w-engineering', title: 'Creative Workflows', description: 'Inspect negative prompts, aspect ratios, seeds, and parameters shared by expert prompt designers.' },
    { id: 'w-grow', title: 'Image Creation Portfolio', description: 'Build your public AI image prompt portfolio, gather followers, and showcase your creativity.' }
  ];

  // How Prizom Works Steps
  const howSteps = [
    { 
      step_number: '01', 
      title: 'Discover', 
      description: 'Discover a curated canvas of generative art and inspect the exact AI image prompts behind them.' 
    },
    { 
      step_number: '02', 
      title: 'Remix & Customize', 
      description: 'Instantly copy image prompt formulas, customize aspect ratios, weights, and remix parameters.' 
    },
    { 
      step_number: '03', 
      title: 'Create & Share', 
      description: 'Generate stunning artwork with your preferred image creator tool and publish it back to the Discover feed.' 
    }
  ];
  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc] text-zinc-900 overflow-x-hidden font-sans">
      
      {/* 1. Global Notice Alert Banner (CMS driven) */}
      {homepage.show_banner && homepage.banner_text && (
        <div className="w-full bg-zinc-950 text-white text-center py-2 px-4 relative z-10 flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-widest">
          <span>{homepage.banner_text}</span>
          {homepage.banner_link && (
            <Link 
              id="notice-banner-link"
              href={homepage.banner_link}
              className="text-indigo-400 hover:text-indigo-300 underline ml-2 shrink-0 transition-colors"
            >
              Check it out →
            </Link>
          )}
        </div>
      )}

      {/* 2. Global Announcement Banner (CMS driven) */}
      {homepage.show_announcement && homepage.announcement && (
        <div className="w-full bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] text-white text-center py-3 px-4 relative z-10 flex items-center justify-center gap-3 shadow-md">
          <Megaphone className="w-4 h-4 text-purple-200 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider leading-none">
            {homepage.announcement}
          </span>
          {homepage.banner_link && (
            <Link 
              id="announcement-banner-link"
              href={homepage.banner_link}
              className="bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all leading-none shrink-0"
            >
              {homepage.announcement_cta_text || 'Learn More'}
            </Link>
          )}
        </div>
      )}

      {/* SECTION 1: Hero (Centered vs Split layout depending on CMS settings) */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full min-h-[80vh] flex flex-col justify-center overflow-hidden">
        {/* Premium Depth & Animated Ambient Glows */}
        <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--color-electric-blue)]/10 blur-[130px] animate-blob" />
          <div className="absolute top-[15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[var(--color-neon-purple)]/10 blur-[140px] animate-blob [animation-delay:4s]" />
          <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-pink-500/5 blur-[120px] animate-blob [animation-delay:8s]" />
          
          {/* Tech Grid Mask Accent */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        {homepage.hero_layout === 'centered' ? (
          // Centered Layout (Alternate)
          <div className="flex flex-col items-center w-full text-center max-w-5xl mx-auto z-10 space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-purple-50/80 border border-purple-100/50 rounded-full px-4 py-1.5 shadow-xs backdrop-blur-xs mx-auto">
                <PrizomLogo size={16} className="text-[var(--color-neon-purple)]" />
                <span className="text-[10px] font-black text-purple-950 uppercase tracking-widest">
                  Open Collaborative Registry
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-tight uppercase select-none max-w-4xl mx-auto">
                {renderRefinedTitle(homepage.hero_title)}
              </h1>
            </div>

            {/* Separator Line & Side-by-side Details */}
            <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-t border-zinc-200/60 pt-8 max-w-4xl mx-auto text-left">
              {/* Left detail: constrained description */}
              <div className="md:col-span-7">
                <p className="text-zinc-600 font-semibold text-sm sm:text-base leading-relaxed max-w-md">
                  {homepage.hero_subtitle || "Discover, remix, and publish AI image prompts. Build your reputation, follow top creators, and grow your visual style portfolio — all in one collaborative registry."}
                </p>
              </div>

              {/* Right detail: CTAs */}
              <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-row gap-4 justify-start md:justify-end">
                <Link 
                  id="hero-centered-cta-explore"
                  href={heroCtaLink}
                  className="px-8 py-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-white text-xs font-extrabold uppercase tracking-widest rounded-full hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 text-center shrink-0"
                >
                  {heroCtaText}
                </Link>
                <Link 
                  id="hero-centered-cta-signup"
                  href="/signup"
                  className="px-8 py-4 bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-xs font-extrabold uppercase tracking-widest rounded-full shadow-xs hover:shadow-md transition-all duration-300 text-center shrink-0"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Split Layout (Default)
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center w-full max-w-7xl mx-auto z-10">
            
            {/* Left Column: CTA Buttons Area (Stays below text on mobile, on the left on desktop/tablet) */}
            <div className="md:col-span-4 flex flex-col justify-center space-y-4 md:pr-8 order-2 md:order-1 w-full max-w-xs mx-auto md:mx-0">
              <Link 
                id="hero-split-cta-explore"
                href={heroCtaLink}
                className="w-full px-8 py-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-white text-xs font-extrabold uppercase tracking-widest rounded-full hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 text-center"
              >
                {heroCtaText}
              </Link>
              <Link 
                id="hero-split-cta-signup"
                href="/signup"
                className="w-full px-8 py-4 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-xs font-extrabold uppercase tracking-widest rounded-full shadow-xs hover:shadow-md transition-all duration-300 text-center"
              >
                Create Free Account
              </Link>
            </div>

            {/* Right Column: Editorial Headline & Body (Stays on top on mobile, on the right on desktop/tablet) */}
            <div className="md:col-span-8 flex flex-col justify-center text-left space-y-6 md:pl-12 lg:pl-16 border-t md:border-t-0 md:border-l border-zinc-200/50 pt-8 md:pt-0 order-1 md:order-2 w-full">
              <div className="inline-flex items-center space-x-2 bg-purple-50/80 border border-purple-100/50 rounded-full px-4 py-1.5 shadow-xs w-fit backdrop-blur-xs">
                <PrizomLogo size={16} className="text-[var(--color-neon-purple)]" />
                <span className="text-[10px] font-black text-purple-950 uppercase tracking-widest">
                  Open Collaborative Registry
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[2.75rem] xl:text-5xl font-black text-zinc-900 tracking-tight leading-tight uppercase select-none max-w-2xl">
                {renderRefinedTitle(homepage.hero_title)}
              </h1>

              <p className="text-zinc-700 font-semibold text-sm sm:text-base leading-relaxed max-w-md">
                {homepage.hero_subtitle || "Discover, remix, and publish AI image prompts. Build your reputation, follow top creators, and grow your visual style portfolio — all in one collaborative registry."}
              </p>
            </div>

          </div>
        )}

        {/* 5-Pillar Value-Prop Strip */}
        <div className="mt-12 w-full max-w-5xl mx-auto z-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { icon: Search,      label: 'Discover',          sub: 'Curated image prompt feeds' },
              { icon: GitFork,     label: 'Remix',             sub: 'Remix & adapt visual styles' },
              { icon: Heart,       label: 'Follow Creators',   sub: 'Build your network' },
              { icon: Layers,      label: 'Build Reputation',  sub: 'Creative portfolio' },
              { icon: Sparkles,    label: 'Publish',           sub: 'Share image creation formulas' },
            ].map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 bg-white/70 backdrop-blur-sm border border-zinc-200/60 rounded-2xl px-3 py-4 text-center hover:border-purple-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[var(--color-neon-purple)] shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-zinc-900 uppercase tracking-wider leading-none">{label}</span>
                <span className="text-[9px] font-semibold text-zinc-400 leading-none">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: Collaborative Masonry Gallery (Content-First Discovery Feed) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full border-t border-zinc-100/60">
        <div className="text-center space-y-3 mb-16">
          <span className="text-[10px] font-black text-[var(--color-neon-purple)] uppercase tracking-widest">
            {realPrompts.length >= 4 ? 'Inspiration Feed' : 'Creative Showcases'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight uppercase">
            {realPrompts.length >= 4 ? 'See What People Are Creating' : 'Discover Inspiring AI Styles'}
          </h2>
          <p className="text-zinc-500 font-bold text-sm max-w-xl mx-auto">
            {realPrompts.length >= 4 
              ? 'Real prompt creations shared by Prizom artists. Click any card to inspect weights, models, and parameters.' 
              : 'Browse high-quality AI aesthetic directions. Select any style card to view prompt workflows.'}
          </p>
        </div>

        {realPrompts.length >= 4 ? (
          // Display Real Supabase Prompts
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
            {realPrompts.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/prompt/${prompt.id}`}
                className="block w-full mb-4 sm:mb-6 break-inside-avoid bg-white rounded-3xl relative group cursor-pointer border border-black/5 hover:border-[var(--color-neon-purple)]/30 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1 overflow-hidden flex flex-col"
              >
                <div className="relative w-full bg-zinc-100 rounded-t-3xl overflow-hidden aspect-[3/4]">
                  <img
                    src={prompt.image_url}
                    alt={prompt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-4 left-4 right-4 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] font-black uppercase tracking-wider text-purple-300 bg-purple-900/50 px-2.5 py-1 rounded backdrop-blur-sm border border-purple-800/30">
                      {prompt.ai_tool}
                    </span>
                    <h3 className="text-base font-black text-white uppercase tracking-wider mt-2 truncate">{prompt.title}</h3>
                  </div>
                </div>

                {/* Creator Metadata (no fake counts/stats) */}
                <div className="p-4 flex items-center justify-between border-t border-zinc-100/50 bg-[#fcfcfc]">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="h-6 w-6 rounded-full bg-zinc-200 overflow-hidden shrink-0">
                      {prompt.profiles?.avatar_url ? (
                        <img src={prompt.profiles.avatar_url} alt={prompt.profiles.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black bg-purple-100 text-purple-700 uppercase">
                          {prompt.profiles?.username?.[0] || 'P'}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-zinc-700 font-bold truncate">@{prompt.profiles?.username || 'creator'}</span>
                  </div>
                  {prompt.aspect_ratio && (
                    <span className="text-[9px] font-bold text-zinc-400 uppercase bg-zinc-100 px-2 py-0.5 rounded shrink-0">
                      {prompt.aspect_ratio}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          // Display Pre-configured Aesthetic Showcase Blocks (No fake likes, creators, etc.)
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
            {inspirationalShowcaseCards.map((tile) => (
              <div
                key={tile.id}
                onClick={() => handleTagClick(tile.tag)}
                className="block w-full mb-4 sm:mb-6 break-inside-avoid bg-white rounded-3xl relative group cursor-pointer border border-black/5 hover:border-[var(--color-neon-purple)]/30 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1 overflow-hidden flex flex-col animate-in fade-in"
              >
                <div className="relative w-full bg-zinc-100 rounded-t-3xl overflow-hidden aspect-[3/4]">
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <span className="text-[8px] font-black uppercase tracking-wider text-purple-300 bg-purple-900/50 px-2.5 py-1 rounded backdrop-blur-sm border border-purple-800/30">
                      {tile.tool}
                    </span>
                    <h3 className="text-base font-black text-white uppercase tracking-wider mt-2">{tile.title}</h3>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between border-t border-zinc-100/50 bg-[#fcfcfc] text-xs font-black text-purple-600 uppercase tracking-wider group-hover:text-purple-700">
                  <span>Discover Style</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 4: How Prizom Works (Visual Flow, minimal text) */}
      <section className="bg-zinc-50 border-y border-zinc-200/50 py-24 px-4 sm:px-6 lg:px-8 w-full relative">
        <div className="max-w-[1600px] mx-auto text-center space-y-16">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-black text-[var(--color-neon-purple)] uppercase tracking-widest">
              Platform Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight uppercase">
              How Prizom Works
            </h2>
            <p className="text-zinc-500 font-semibold text-sm max-w-lg mx-auto">
              Three clean steps to find image prompt formulas, customize visual styles, and output artwork.
            </p>
          </div>

          <div className="relative mt-20 max-w-6xl mx-auto">
            {/* Horizontal Timeline Connector (Desktop Only) */}
            <div className="hidden lg:block absolute top-[52px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-[var(--color-neon-purple)]/25 via-indigo-500/20 to-[var(--color-electric-blue)]/25 -z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left relative z-10 items-stretch">
              {howSteps.map((step) => (
                <div 
                  key={step.step_number} 
                  className="group relative bg-gradient-to-b from-white/70 to-white/30 backdrop-blur-md border border-zinc-200/50 hover:border-purple-300 rounded-[2.5rem] p-8 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between min-h-[220px] overflow-hidden"
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[var(--color-neon-purple)]">
                        {step.step_number === '01' && <Search className="w-5 h-5 shrink-0" />}
                        {step.step_number === '02' && <Copy className="w-5 h-5 shrink-0" />}
                        {step.step_number === '03' && <Sparkles className="w-5 h-5 shrink-0" />}
                      </div>
                      <span className="text-6xl font-black text-zinc-100 group-hover:text-purple-200 transition-colors duration-300 tracking-tighter leading-none select-none">
                        {step.step_number}
                      </span>
                    </div>

                    <div className="space-y-2 text-left">
                      <h3 className="text-lg font-black text-zinc-950 uppercase tracking-wider">{step.title}</h3>
                      <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Why Prizom (Creator Benefits) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full">
        <div className="text-center space-y-3 mb-16">
          <span className="text-[10px] font-black text-[var(--color-neon-purple)] uppercase tracking-widest">
            Platform Benefits
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight uppercase">
            Why Prizom
          </h2>
          <p className="text-zinc-500 font-bold text-sm">
            A visual ecosystem optimized for prompt engineering and saving.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {whyCards.map((card) => (
            <div 
              key={card.id}
              className="bg-white border border-zinc-200/60 p-8 rounded-[2rem] shadow-sm text-left hover:border-purple-200 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-black mb-6">✓</div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider mb-2">{card.title}</h3>
              <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: Dynamic Promotional Blocks (CMS-driven active items) */}
      {homepage.promo_blocks && homepage.promo_blocks.filter(b => b.is_active).length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full border-t border-zinc-100/60 bg-zinc-50/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto text-left">
            {homepage.promo_blocks
              .filter(b => b.is_active)
              .map((block) => (
                <div 
                  key={block.id} 
                  className={`bg-white border border-zinc-200/50 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between ${
                    block.style === 'banner' ? 'md:col-span-2 lg:col-span-3' : block.style === 'feature' ? 'lg:col-span-2' : ''
                  }`}
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-zinc-900 uppercase tracking-wider">{block.title}</h3>
                    <p className="text-xs text-zinc-500 font-semibold leading-relaxed">{block.content}</p>
                  </div>
                  {block.link_url && block.link_text && (
                    <div className="pt-6">
                      <a 
                        href={block.link_url}
                        className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all"
                      >
                        {block.link_text}
                      </a>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* SECTION 7: Login/Signup CTA */}
      <section className="bg-zinc-900 text-white py-28 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden w-full border-t border-zinc-800">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--color-neon-purple)]/10 to-[var(--color-electric-blue)]/10 rounded-full blur-[140px] pointer-events-none -z-0" />

        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none uppercase">
            Ready to Build Better AI Images?
          </h2>
          <p className="text-zinc-400 font-bold text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Archive configurations, save style collections, track parent remixes, and discover creative prompt templates. Free forever.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto">
            <Link 
              id="footer-promo-signup"
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] text-white text-xs font-black uppercase tracking-widest rounded-full hover:shadow-[0_8px_25px_rgba(168,85,247,0.3)] hover:-translate-y-0.5 transition-all animate-pulse"
            >
              Create Account
            </Link>
            <Link 
              id="footer-promo-explore"
              href={heroCtaLink}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black uppercase tracking-widest rounded-full transition-all"
            >
              Discover Prompts
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
