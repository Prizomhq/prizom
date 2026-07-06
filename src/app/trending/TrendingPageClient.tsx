'use client';

import { useState, useTransition } from 'react';
import { TrendingUp, Calendar, Zap, Flame } from 'lucide-react';
import Link from 'next/link';
import MasonryGrid from '@/components/ui/MasonryGrid';
import PromptCard from '@/components/ui/PromptCard';
import { getTrendingData } from '@/app/actions/trending';
import SkeletonCard from '@/components/ui/SkeletonCard';

export type TrendingTimeframe = 'Today' | 'This Week' | 'This Month' | 'All Time';

interface TrendingPageClientProps {
  initialPrompts: any[];
  initialRemixes: any[];
}

export default function TrendingPageClient({ initialPrompts, initialRemixes }: TrendingPageClientProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<TrendingTimeframe>('This Week');
  const [prompts, setPrompts] = useState<any[]>(initialPrompts);
  const [remixes, setRemixes] = useState<any[]>(initialRemixes);
  const [isPending, startTransition] = useTransition();

  const handleTimeframeChange = (timeframe: TrendingTimeframe) => {
    setActiveTimeframe(timeframe);
    startTransition(async () => {
      try {
        const data = await getTrendingData(timeframe);
        setPrompts(data.prompts || []);
        setRemixes(data.remixes || []);
      } catch (err) {
        console.error('Failed to fetch trending data:', err);
      }
    });
  };

  const timeframes: TrendingTimeframe[] = ['Today', 'This Week', 'This Month', 'All Time'];

  return (
    <div className="min-h-screen pb-12 md:pb-28 pt-8 bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Clean Light-Themed Title Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 text-zinc-900 flex items-center tracking-tight leading-none uppercase">
              <TrendingUp className="w-9 h-9 mr-3 text-[var(--color-neon-purple)]" />
              Trending Prompts
            </h1>
            <p className="text-zinc-550 font-semibold mt-2 text-sm sm:text-base">The most popular and highly-rated AI prompts across Prizom.</p>
          </div>

          {/* Time Filters */}
          <div className="flex flex-wrap gap-2 bg-white border border-zinc-200 p-1.5 rounded-[1.5rem] shadow-xs shrink-0">
            {timeframes.map((tag) => (
              <button 
                key={tag} 
                onClick={() => handleTimeframeChange(tag)}
                disabled={isPending}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 ${
                  tag === activeTimeframe 
                    ? 'bg-zinc-900 text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LOADING INDICATOR OVERLAY */}
        {isPending ? (
          <MasonryGrid>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </MasonryGrid>
        ) : (
          <div className="space-y-16 animate-in fade-in duration-300">
            
            {/* SECTION 1: TOP TRENDING REMIXES */}
            {remixes.length > 0 && (
              <div>
                <div className="mb-8">
                  <span className="block text-[10px] font-black text-[var(--color-neon-purple)] uppercase tracking-widest mb-1.5">Community Evolution</span>
                  <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-2.5 tracking-tight uppercase leading-none">
                    <Zap className="w-5 h-5 text-[var(--color-neon-purple)]" />
                    Top Trending Remixes
                  </h2>
                  <p className="text-sm text-zinc-500 font-semibold mt-1.5">Discover viral community remixes, variations, and collaborative creations ranking high today.</p>
                </div>

                <MasonryGrid>
                  {remixes.map((prompt) => (
                    <PromptCard 
                      key={prompt.id} 
                      id={prompt.id}
                      title={prompt.title}
                      imageUrl={prompt.image_url}
                      tool={prompt.ai_tool}
                      creator={{ 
                        username: prompt.profiles?.username || 'unknown',
                        displayName: prompt.profiles?.full_name,
                        avatarUrl: prompt.profiles?.avatar_url,
                        badges: prompt.profiles?.badges
                      }}
                      likes={prompt.likes_count}
                      saves={prompt.saves_count || 0}
                      description={prompt.description}
                      tags={prompt.tags}
                      remixOf={prompt.remix_of}
                      remixCount={prompt.remix_count}
                      aspectRatio={prompt.aspect_ratio || '1:1'}
                      category={prompt.category}
                      imageWidth={prompt.image_width}
                      imageHeight={prompt.image_height}
                    />
                  ))}
                </MasonryGrid>
              </div>
            )}

            {/* SECTION 2: TRENDING PROMPTS */}
            <div>
              {prompts.length > 0 && (
                <div className="mb-8">
                  {remixes.length > 0 && <div className="border-t border-zinc-200/60 pt-12 mb-8" />}
                  <span className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">Original Seeds</span>
                  <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-2.5 tracking-tight uppercase leading-none">
                    <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                    Trending Original Masterpieces
                  </h2>
                  <p className="text-sm text-zinc-500 font-semibold mt-1.5">The most influential seed prompts currently trending in the Prizom network.</p>
                </div>
              )}

              {prompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[2.5rem] border border-zinc-200/80 shadow-sm mt-4">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-5 border border-zinc-100">
                    <TrendingUp className="w-8 h-8 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 mb-1.5">No trending prompts found for this timeframe</h3>
                  <p className="text-zinc-550 text-sm max-w-sm mb-6 font-medium">Be the first to create an AI prompt and begin climbing the trending leaderboards.</p>
                  <Link href="/create" className="inline-flex items-center justify-center px-6 py-3 text-xs font-black text-white transition-all bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] rounded-full hover:shadow-[0_8px_20px_rgba(168,85,247,0.3)] hover:-translate-y-0.5">
                    <Zap className="w-4 h-4 mr-1.5" />
                    Create Prompt
                  </Link>
                </div>
              ) : (
                <MasonryGrid>
                  {prompts.map((prompt) => (
                    <PromptCard 
                      key={prompt.id} 
                      id={prompt.id}
                      title={prompt.title}
                      imageUrl={prompt.image_url}
                      tool={prompt.ai_tool}
                      creator={{ 
                        username: prompt.profiles?.username || 'unknown',
                        displayName: prompt.profiles?.full_name,
                        avatarUrl: prompt.profiles?.avatar_url,
                        badges: prompt.profiles?.badges
                      }}
                      likes={prompt.likes_count}
                      saves={prompt.saves_count || 0}
                      description={prompt.description}
                      tags={prompt.tags}
                      remixOf={prompt.remix_of}
                      remixCount={prompt.remix_count}
                      aspectRatio={prompt.aspect_ratio || '1:1'}
                      category={prompt.category}
                      imageWidth={prompt.image_width}
                      imageHeight={prompt.image_height}
                    />
                  ))}
                </MasonryGrid>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
