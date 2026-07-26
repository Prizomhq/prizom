'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowUpRight, 
  Heart, 
  GitFork, 
  Flame,
  Sparkles,
  Plus
} from 'lucide-react';

interface PromptItem {
  id: string;
  title: string;
  image_url?: string;
  ai_tool?: string;
  category?: string;
  likes_count?: number;
  remix_count?: number;
  profiles?: {
    username?: string;
    avatar_url?: string;
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
            Trending This Week
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
            Popular AI Prompt Formulas
          </h2>
          <p className="text-zinc-500 font-medium text-sm">
            Top-rated prompts created by the Prizom community. Select any formula to view parameters.
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

      {/* Prompts Cards Grid or Polished Empty State */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredList.slice(0, 6).map((item) => (
            <Link
              key={item.id}
              href={`/prompt/${item.id}`}
              className="group bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col"
            >
              {/* Image Preview Container */}
              <div className="aspect-[4/3] relative w-full overflow-hidden bg-zinc-100">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop'}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase tracking-wide">
                    {item.ai_tool || 'Midjourney'}
                  </span>
                </div>
              </div>

              {/* Card Content Footer */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    @{item.profiles?.username || 'creator'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs font-mono text-zinc-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-rose-600 font-semibold">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      {item.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-zinc-400" />
                      {item.remix_count || 0} remixes
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Catalog Footer Link */}
      <div className="mt-10 text-center">
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 text-xs font-semibold shadow-2xs transition-colors"
        >
          <span>Explore All Published Prompts in Catalog</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

    </section>
  );
}
