'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowUpRight, 
  Flame,
  Sparkles,
  Plus
} from 'lucide-react';
import PromptCard from '@/components/ui/PromptCard';
import MasonryGrid from '@/components/ui/MasonryGrid';

interface PromptItem {
  id: string;
  title: string;
  image_url?: string | null;
  ai_tool?: string;
  category?: string | null;
  likes_count?: number;
  saves_count?: number;
  remix_count?: number | null;
  remix_of?: string | null;
  description?: string | null;
  tags?: string[] | null;
  aspect_ratio?: string | null;
  profiles?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
    badges?: string[];
  };
}

interface TrendingCatalogProps {
  prompts: PromptItem[];
}

export default function TrendingCatalogSection({ prompts = [] }: TrendingCatalogProps) {
  const [activeTab, setActiveTab] = useState('all');

  const displayList = prompts;

  // Extract dynamic categories & tools present in the real database prompts
  const availableTools = Array.from(
    new Set(displayList.map(p => p.ai_tool).filter(Boolean) as string[])
  );

  const dynamicTabs = [
    { id: 'all', label: 'All Formulas' },
    ...availableTools.map(tool => ({
      id: tool.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: tool
    }))
  ];

  const filteredList = displayList.filter(item => {
    if (activeTab === 'all') return true;
    const tool = (item.ai_tool || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return tool === activeTab;
  });

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full border-t border-zinc-200/80">
      
      {/* Header & Dynamic Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 max-w-7xl mx-auto">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" />
            Popular AI Prompt Formulas
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
            Production Prompt Formulas
          </h2>
          <p className="text-zinc-500 font-medium text-sm">
            Top-rated prompt configurations created by the Prizom community. Inspect parameters, copy weights, or remix.
          </p>
        </div>

        {/* Dynamic Filter Pills (Only rendered for tools with published prompts) */}
        {dynamicTabs.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {dynamicTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-white border border-zinc-200/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prompts Cards Grid using Unified Production PromptCard */}
      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-zinc-200/80 shadow-2xs max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900">No Published Prompts Found</h3>
            <p className="text-xs text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
              Be the first creator to publish an AI prompt formula in this category.
            </p>
          </div>
          <Link
            href="/create"
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Prompt</span>
          </Link>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <MasonryGrid>
            {filteredList.slice(0, 8).map((item) => (
              <PromptCard
                key={item.id}
                id={item.id}
                title={item.title}
                imageUrl={item.image_url}
                tool={item.ai_tool || 'Midjourney'}
                creator={{
                  username: item.profiles?.username || 'creator',
                  displayName: item.profiles?.full_name,
                  avatarUrl: item.profiles?.avatar_url,
                  badges: item.profiles?.badges
                }}
                likes={item.likes_count || 0}
                saves={item.saves_count || 0}
                description={item.description}
                tags={item.tags}
                remixOf={item.remix_of}
                remixCount={item.remix_count}
                aspectRatio={item.aspect_ratio || '1:1'}
                category={item.category || 'General'}
              />
            ))}
          </MasonryGrid>
        </div>
      )}

      {/* Catalog Footer Link */}
      <div className="mt-12 text-center">
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 text-xs font-semibold shadow-2xs transition-colors"
        >
          <span>Explore All Published Prompts in Discover Feed</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

    </section>
  );
}
