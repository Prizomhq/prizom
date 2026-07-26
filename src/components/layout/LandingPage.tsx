'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  ChevronRight,
  Megaphone,
  Search,
  Layers,
  CheckCircle,
  Copy,
  GitFork,
  Heart,
  Send,
  Sparkles,
  Users,
  FileText,
  ShieldCheck,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PrizomLogo from '@/components/ui/PrizomLogo';
import PromptWall from '@/components/landing/PromptWall';
import TrendingCatalogSection from '@/components/landing/TrendingCatalogSection';
import CreatorSpotlightSection from '@/components/landing/CreatorSpotlightSection';
import LandingFAQSection from '@/components/landing/LandingFAQSection';




interface WhyCard {
  id: string;
  title: string;
  description: string;
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
    };
    footer: any;
  };
}

export default function LandingPage({ cmsData }: LandingPageProps) {
  const router = useRouter();
  const { homepage } = cmsData;
  const heroCtaText = homepage.hero_cta_text || 'Start Creating Free →';
  const heroCtaLink = homepage.hero_cta_link || '/signup';

  const [realPrompts, setRealPrompts] = useState<any[]>([]);

  // Fetch real prompts from Supabase for PromptWall
  useEffect(() => {
    async function fetchRealPrompts() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('prompts')
          .select('id, title, image_url, ai_tool, likes_count, profiles!user_id(username, avatar_url)')
          .eq('moderation_status', 'active')
          .order('created_at', { ascending: false })
          .limit(16);

        if (data && data.length >= 4) {
          const formatted = data.map((p: any) => ({
            id: p.id,
            title: p.title,
            image: p.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
            tool: p.ai_tool || 'Midjourney',
            creator: p.profiles?.username || 'creator',
            likesCount: p.likes_count || 0
          }));
          setRealPrompts(formatted);
        }
      } catch (err) {
        console.error('Failed to query real prompts:', err);
      }
    }
    fetchRealPrompts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900 overflow-x-hidden font-sans">
      
      {/* 1. Notice Banner (CMS driven) */}
      {homepage.show_banner && homepage.banner_text && (
        <div className="w-full bg-zinc-950 text-white text-center py-2 px-4 relative z-10 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider">
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
        <div className="w-full bg-indigo-600 text-white text-center py-2.5 px-4 relative z-10 flex items-center justify-center gap-3 shadow-xs">
          <Megaphone className="w-4 h-4 text-indigo-200 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            {homepage.announcement}
          </span>
          {homepage.banner_link && (
            <Link 
              id="announcement-banner-link"
              href={homepage.banner_link}
              className="bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shrink-0"
            >
              {homepage.announcement_cta_text || 'Learn More'}
            </Link>
          )}
        </div>
      )}

      {/* SECTION 1: World-Class Split Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full flex flex-col justify-center overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/[0.04] blur-[140px]" />
          <div className="absolute top-[15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/[0.04] blur-[150px]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full max-w-7xl mx-auto z-10">
          
          {/* Left Column: Hero Content & Value Positioning (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left space-y-8">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center space-x-2.5 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 shadow-2xs w-fit">
              <PrizomLogo size={18} />
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                The Open Registry & Studio for AI Prompt Engineering
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 tracking-tight leading-[1.1] text-balance">
              Discover, Remix & Publish <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800">
                Production AI Prompts
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-zinc-600 font-medium text-base sm:text-lg leading-relaxed max-w-2xl">
              {homepage.hero_subtitle || "Explore photorealistic prompt formulas, remix Midjourney & Flux parameters, track prompt lineage trees, and build your visual AI creator portfolio."}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link 
                id="hero-cta-primary"
                href={heroCtaLink}
                className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 text-center flex items-center justify-center gap-2"
              >
                <span>{heroCtaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                id="hero-cta-secondary"
                href="/discover"
                className="px-8 py-4 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 text-sm font-semibold rounded-2xl shadow-xs hover:shadow-sm transition-all duration-200 text-center"
              >
                Explore Prompt Catalog
              </Link>
            </div>

            {/* Live Trust Badges */}
            <div className="pt-6 border-t border-zinc-200/80 flex items-center gap-6 text-xs text-zinc-500 font-medium flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span><strong className="font-bold text-zinc-900">14,000+</strong> Creators</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span><strong className="font-bold text-zinc-900">85,000+</strong> Prompts Cataloged</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Open Collaborative Registry</span>
              </div>
            </div>

          </div>

          {/* Right Column: 60 FPS Infinite Prompt Wall (5 Cols) */}
          <div className="lg:col-span-5 w-full">
            <PromptWall prompts={realPrompts} />
          </div>

        </div>

      </section>

      {/* SECTION 2: Why Prizom? (4 Interactive Feature Pillars) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full border-t border-zinc-200/80">
        <div className="text-center space-y-3 mb-14">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            Why Creators Choose Prizom
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
            Built for Generative AI Prompt Engineers
          </h2>
          <p className="text-zinc-500 font-medium text-sm max-w-xl mx-auto">
            Organize creative prompt formulas, inspect parameters, and track version lineages.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {[
            {
              icon: FileText,
              title: 'Permanent Visual Registry',
              desc: 'Store your image prompt formulas, negative prompts, seeds, and weights in one structured library.'
            },
            {
              icon: GitFork,
              title: 'Prompt Lineage Trees',
              desc: 'Remix existing prompt formulas while preserving automatic attribution chains to original creators.'
            },
            {
              icon: Sparkles,
              title: 'Integrated AI Studio',
              desc: 'Analyze visual style DNA, test prompts across multiple AI generators, and optimize parameters.'
            },
            {
              icon: Users,
              title: 'Verified Creator Portfolio',
              desc: 'Build your public AI engineering portfolio, earn verified creator standing, and grow your followers.'
            }
          ].map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 space-y-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 tracking-tight">{pillar.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: Trending Prompt Formulas Catalog */}
      <TrendingCatalogSection prompts={realPrompts} />

      {/* SECTION 4: Top Creators & Lineage Trees Showcase */}
      <CreatorSpotlightSection />

      {/* SECTION 5: Community Telemetry Counter */}


      <section className="py-16 bg-zinc-900 text-white border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-indigo-400">14,250+</span>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Registered Creators</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-emerald-400">85,900+</span>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prompts Cataloged</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-indigo-400">210,000+</span>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prompt Remixes Crafted</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-emerald-400">99.98%</span>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Platform Availability</p>
          </div>
        </div>
      </section>

      {/* SECTION 6: Interactive FAQ Accordion */}
      <LandingFAQSection />

      {/* SECTION 7: Final Call to Action */}

      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
          <Zap className="w-6 h-6" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
          Ready to Build Your AI Creator Portfolio?
        </h2>
        <p className="text-zinc-500 font-medium text-sm max-w-lg mx-auto leading-relaxed">
          Join thousands of prompt engineers, creators, and digital artists building the open prompt registry.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/signup"
            className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-2xl shadow-md transition-colors flex items-center gap-2"
          >
            <span>Start Creating Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
