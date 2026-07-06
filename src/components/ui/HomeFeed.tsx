'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import PromptCard from '@/components/ui/PromptCard';
import MasonryGrid from '@/components/ui/MasonryGrid';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { fetchRecommendedPrompts } from '@/app/actions/recommendations';
import { getUserInterests } from '@/lib/recommendations-client';
import { Loader2, Sparkles, Compass, TrendingUp } from 'lucide-react';

export default function HomeFeed() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Load first page on mount
  useEffect(() => {
    async function loadInitialPrompts() {
      setLoading(true);
      try {
        const interests = getUserInterests();
        const res = await fetchRecommendedPrompts({
          page: 0,
          limit: 15,
          interests
        });
        setPrompts(res.prompts);
        setHasMore(res.hasMore);
        setPage(1);
      } catch (err) {
        console.error('Failed to load initial recommended prompts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialPrompts();
  }, []);

  // Intersection Observer for Infinite Scrolling
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadingRef.current = true;
          setLoadingMore(true);
          try {
            const interests = getUserInterests();
            const res = await fetchRecommendedPrompts({
              page,
              limit: 15,
              interests
            });
            
            if (res.prompts.length > 0) {
              setPrompts((prev) => {
                // Deduplicate just in case
                const existingIds = new Set(prev.map(p => p.id));
                const newPrompts = res.prompts.filter(p => !existingIds.has(p.id));
                return [...prev, ...newPrompts];
              });
              setHasMore(res.hasMore);
              setPage((prev) => prev + 1);
            } else {
              setHasMore(false);
            }
          } catch (err) {
            console.error('Failed to fetch more recommended prompts:', err);
          } finally {
            setLoadingMore(false);
            loadingRef.current = false;
          }
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, loading, loadingMore]);

  if (loading) {
    return (
      <div className="w-full">
        <MasonryGrid>
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </MasonryGrid>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-xl mx-auto px-6">
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-[var(--color-neon-purple)]/10 to-[var(--color-electric-blue)]/10 flex items-center justify-center border border-[var(--color-neon-purple)]/20">
            <Sparkles className="w-12 h-12 text-[var(--color-neon-purple)]" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm shadow-lg">
            ✨
          </div>
        </div>
        <h3 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">Your feed is warming up</h3>
        <p className="text-zinc-500 font-medium text-sm leading-relaxed mb-8">
          Discover and follow creators to build a personalized feed. Or dive straight into the community's best work.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Link href="/discover" className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] text-white text-sm font-bold hover:shadow-[0_8px_20px_rgba(168,85,247,0.3)] transition-all hover:-translate-y-0.5">
            <Compass className="w-4 h-4" />
            Discover Prompts
          </Link>
          <Link href="/trending" className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-zinc-900 text-sm font-bold border border-zinc-200 hover:border-zinc-300 transition-all hover:-translate-y-0.5 shadow-sm">
            <TrendingUp className="w-4 h-4" />
            See Trending
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
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
            description={prompt.description}
            tags={prompt.tags}
            remixOf={prompt.remix_of}
            remixCount={prompt.remix_count}
            aspectRatio={prompt.aspect_ratio}
            category={prompt.category}
          />
        ))}
      </MasonryGrid>

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div ref={observerRef} className="flex justify-center items-center py-10 w-full">
          {loadingMore ? (
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-6 py-3 border border-zinc-200/50 rounded-full shadow-md">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-neon-purple)]" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-600">Discovering more prompts...</span>
            </div>
          ) : (
            <div className="h-4 w-full" />
          )}
        </div>
      )}

      {!hasMore && prompts.length > 0 && (
        <div className="flex justify-center items-center py-16 text-center text-zinc-400 text-xs font-black uppercase tracking-widest border-t border-zinc-100 mt-10">
          ✨ You've discovered all current prompt masterpieces! ✨
        </div>
      )}
    </div>
  );
}
