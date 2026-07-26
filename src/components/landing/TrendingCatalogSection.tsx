'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowUpRight, 
  Heart, 
  GitFork, 
  Flame,
  CheckCircle
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

const filterTabs = [
  { id: 'all', label: 'All Formulas' },
  { id: 'midjourney', label: 'Midjourney' },
  { id: 'flux', label: 'Flux.1' },
  { id: 'photorealism', label: 'Photorealism' },
  { id: 'anime', label: 'Anime' },
  { id: 'vector', label: 'Logos & Vector' },
];

// Fallback showcase items if database has low item count
const fallbackPrompts: PromptItem[] = [
  {
    id: 'f-1',
    title: 'Photorealistic Studio Portrait',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
    ai_tool: 'Midjourney',
    category: 'photorealism',
    likes_count: 342,
    remix_count: 48,
    profiles: { username: 'elena_art' }
  },
  {
    id: 'f-2',
    title: 'Ghibli-Style Summer Meadow',
    image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop',
    ai_tool: 'Flux.1',
    category: 'anime',
    likes_count: 512,
    remix_count: 89,
    profiles: { username: 'kenji_design' }
  },
  {
    id: 'f-3',
    title: 'Neon Cyberpunk Metropolis',
    image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop',
    ai_tool: 'Midjourney',
    category: 'cyberpunk',
    likes_count: 890,
    remix_count: 140,
    profiles: { username: 'cyber_vibe' }
  },
  {
    id: 'f-4',
    title: 'Minimalist Vector Fox Logo',
    image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop',
    ai_tool: 'Ideogram',
    category: 'vector',
    likes_count: 215,
    remix_count: 31,
    profiles: { username: 'vector_lab' }
  },
  {
    id: 'f-5',
    title: 'Mythical Crystal Cave',
    image_url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop',
    ai_tool: 'Flux.1',
    category: 'fantasy',
    likes_count: 670,
    remix_count: 95,
    profiles: { username: 'realm_master' }
  },
  {
    id: 'f-6',
    title: 'Cinematic Sci-Fi Mech Unit',
    image_url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&auto=format&fit=crop',
    ai_tool: 'Midjourney',
    category: 'sci-fi',
    likes_count: 430,
    remix_count: 62,
    profiles: { username: 'future_tech' }
  }
];

export default function TrendingCatalogSection({ prompts = [] }: TrendingCatalogProps) {
  const [activeTab, setActiveTab] = useState('all');

  const displayList = prompts.length >= 4 ? prompts : fallbackPrompts;

  const filteredList = displayList.filter(item => {
    if (activeTab === 'all') return true;
    const tool = (item.ai_tool || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    const title = (item.title || '').toLowerCase();

    if (activeTab === 'midjourney') return tool.includes('midjourney');
    if (activeTab === 'flux') return tool.includes('flux');
    if (activeTab === 'photorealism') return cat.includes('photorealism') || title.includes('portrait') || title.includes('photo');
    if (activeTab === 'anime') return cat.includes('anime') || title.includes('anime') || title.includes('ghibli');
    if (activeTab === 'vector') return cat.includes('vector') || title.includes('logo') || title.includes('minimalist');
    return true;
  });

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full border-t border-zinc-200/80">
      
      {/* Header & Filter Tabs */}
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

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {filterTabs.map((tab) => (
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
      </div>

      {/* Prompts Cards Grid */}
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

      {/* Catalog Footer Link */}
      <div className="mt-10 text-center">
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 text-xs font-semibold shadow-2xs transition-colors"
        >
          <span>Explore All 85,000+ Prompts in Catalog</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

    </section>
  );
}
