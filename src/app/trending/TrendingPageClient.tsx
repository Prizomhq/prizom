'use client';

import { useState, useTransition } from 'react';
import { TrendingUp, Sparkles, Zap, Flame, Calendar, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import MasonryGrid from '@/components/ui/MasonryGrid';
import PromptCard from '@/components/ui/PromptCard';
import { getTrendingData, TrendingTimeframe } from '@/app/actions/trending';
import SkeletonCard from '@/components/ui/SkeletonCard';

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
    <div className="min-h-screen pb-6 md:pb-24 pt-8 bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black mb-2 text-zinc-900 flex items-center tracking-tight leading-none">
              <TrendingUp className="w-9 h-9 mr-3 text-[var(--color-neon-purple)]" />
              Trending Prompts
            </h1>
            <p className="text-zinc-500 font-semibold mt-1">The most popular and highly-rated AI prompts across Prizom.</p>
          </div>

          {/* Time Filters */}
          <div className="flex flex-wrap gap-2.5 bg-white border border-zinc-200 p-1.5 rounded-[1.5rem] shadow-sm shrink-0">
            {timeframes.map((tag) => (
              <button 
                key={tag} 
                onClick={() => handleTimeframeChange(tag)}
                disabled={isPending}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
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
              <div className="bg-gradient-to-br from-purple-50/20 via-blue-50/10 to-transparent p-4 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-purple-100/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-neon-purple)]/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="mb-8 relative z-10">
                  <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-2 tracking-tight">
                    <Zap className="w-6 h-6 text-[var(--color-neon-purple)] animate-pulse" />
                    Top Trending Remixes
                  </h2>
                  <p className="text-sm text-zinc-500 font-semibold mt-1">Discover viral community remixes, variations, and collaborative creations ranking high today.</p>
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
                      saves={prompt.saves_count}
                      promptText={prompt.prompt_text}
                      remixOf={prompt.remix_of}
                      remixCount={prompt.remix_count}
                      category={prompt.category}
                    />
                  ))}
                </MasonryGrid>
              </div>
            )}

            {/* SECTION 2: TRENDING PROMPTS */}
            <div>
              {remixes.length > 0 && (
                <div className="mb-8 border-t border-zinc-200/60 pt-12">
                  <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-2 tracking-tight">
                    <Flame className="w-6 h-6 text-red-500" />
                    Trending Original Masterpieces
                  </h2>
                  <p className="text-sm text-zinc-500 font-semibold mt-1">The most influential seed prompts currently trending in the Prizom network.</p>
                </div>
              )}

              {prompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[2.5rem] border border-zinc-200/80 shadow-sm mt-4">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-5 border border-zinc-100">
                    <TrendingUp className="w-8 h-8 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 mb-1.5">No trending prompts found for this timeframe</h3>
                  <p className="text-zinc-500 text-sm max-w-sm mb-6 font-medium">Be the first to create an AI prompt and begin climbing the trending leaderboards.</p>
                  <Link href="/create" className="inline-flex items-center justify-center px-6 py-3 text-xs font-black text-white transition-all bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] rounded-full hover:shadow-[0_8px_20px_rgba(168,85,247,0.3)] hover:-translate-y-0.5">
                    <Sparkles className="w-4 h-4 mr-1.5" />
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
                      saves={prompt.saves_count}
                      promptText={prompt.prompt_text}
                      remixOf={prompt.remix_of}
                      remixCount={prompt.remix_count}
                      category={prompt.category}
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
