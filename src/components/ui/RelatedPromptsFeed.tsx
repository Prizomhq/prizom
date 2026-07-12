'use client';

import { useState, useEffect, useRef } from 'react';
import PromptCard from '@/components/ui/PromptCard';
import MasonryGrid from '@/components/ui/MasonryGrid';
import { fetchRelatedPrompts } from '@/app/actions/recommendations';
import { getUserInterests, trackUserActivity } from '@/lib/recommendations-client';
import { Loader2 } from 'lucide-react';

import { DBPrompt } from '@/types';

interface RelatedPromptsFeedProps {
  promptId: string;
  category: string;
  tool: string;
  aspectRatio: string;
  tags?: string[];
  creatorUsername: string;
}

export default function RelatedPromptsFeed({
  promptId,
  category,
  tool,
  aspectRatio,
  tags = [],
  creatorUsername
}: RelatedPromptsFeedProps) {
  const [prompts, setPrompts] = useState<DBPrompt[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Track the prompt view activity immediately on client mount
  useEffect(() => {
    trackUserActivity('view', {
      category,
      tool,
      aspectRatio,
      tags,
      creator: creatorUsername
    });
  }, [promptId, category, tool, aspectRatio, tags, creatorUsername]);

  // Load first page
  useEffect(() => {
    async function loadInitialRelated() {
      setLoading(true);
      try {
        const interests = getUserInterests();
        const res = await fetchRelatedPrompts({
          promptId,
          page: 0,
          limit: 8,
          interests
        });
        setPrompts(res.prompts);
        setHasMore(res.hasMore);
        setPage(1);
      } catch (err) {
        console.error('Failed to load initial related prompts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialRelated();
  }, [promptId]);

  // Intersection Observer for Infinite scroll
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadingRef.current = true;
          setLoadingMore(true);
          try {
            const interests = getUserInterests();
            const res = await fetchRelatedPrompts({
              promptId,
              page,
              limit: 8,
              interests
            });
            
            if (res.prompts.length > 0) {
              setPrompts((prev) => {
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
            console.error('Failed to load more related prompts:', err);
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
  }, [promptId, page, hasMore, loading, loadingMore]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 w-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-neon-purple)] mb-4" />
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Loading recommendations...</p>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest border border-dashed border-zinc-200 rounded-3xl bg-zinc-50/30">
        No similar prompts found.
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
            imageWidth={prompt.image_width}
            imageHeight={prompt.image_height}
          />
        ))}
      </MasonryGrid>

      {/* Load More trigger */}
      {hasMore && (
        <div ref={observerRef} className="flex justify-center items-center py-8 w-full">
          {loadingMore ? (
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-6 py-2 border border-zinc-200/50 rounded-full shadow-md">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-neon-purple)]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600">Finding similar prompts...</span>
            </div>
          ) : (
            <div className="h-4 w-full" />
          )}
        </div>
      )}
    </div>
  );
}
