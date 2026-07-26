'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/cloudinary-client';

interface PromptWallCard {
  id: string;
  title: string;
  image: string;
  tool?: string;
  creator?: string;
  likesCount?: number;
  tag?: string;
}

interface PromptWallProps {
  prompts?: PromptWallCard[];
}

// Pre-configured high quality fallback showcase cards
const defaultWallCards: PromptWallCard[] = [
  {
    id: 'pw-1',
    title: 'Photorealistic Studio Portrait',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
    tool: 'Midjourney v6.1',
    creator: 'elena_art',
    likesCount: 342,
    tag: 'photorealism'
  },
  {
    id: 'pw-2',
    title: 'Ghibli-Style Anime Landscape',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop',
    tool: 'Flux.1 Dev',
    creator: 'kenji_design',
    likesCount: 512,
    tag: 'anime'
  },
  {
    id: 'pw-3',
    title: 'Neon Cyberpunk Metropolis',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop',
    tool: 'Midjourney v6.1',
    creator: 'cyber_vibe',
    likesCount: 890,
    tag: 'cyberpunk'
  },
  {
    id: 'pw-4',
    title: 'Minimalist Vector Logo Concept',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop',
    tool: 'Ideogram 2.0',
    creator: 'vector_lab',
    likesCount: 215,
    tag: 'branding'
  },
  {
    id: 'pw-5',
    title: 'Mythical Crystal Dragon Shrine',
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop',
    tool: 'Flux.1 Schnell',
    creator: 'realm_master',
    likesCount: 670,
    tag: 'fantasy'
  },
  {
    id: 'pw-6',
    title: 'Cinematic Sci-Fi Mech Unit',
    image: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&auto=format&fit=crop',
    tool: 'Midjourney v6.1',
    creator: 'future_tech',
    likesCount: 430,
    tag: 'sci-fi'
  },
  {
    id: 'pw-7',
    title: 'Sleek Commercial Product Shot',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop',
    tool: 'Flux.1 Dev',
    creator: 'studio_pro',
    likesCount: 310,
    tag: 'product'
  },
  {
    id: 'pw-8',
    title: 'Moody Film Noir Street Photography',
    image: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=600&auto=format&fit=crop',
    tool: 'Midjourney v6.1',
    creator: 'shutter_noir',
    likesCount: 520,
    tag: 'cinematic'
  }
];

export default function PromptWall({ prompts = defaultWallCards }: PromptWallProps) {
  const cardsToDisplay = prompts.length >= 6 ? prompts : defaultWallCards;
  
  // Split into 2 columns for dual inverse scrolling
  const col1 = cardsToDisplay.slice(0, Math.ceil(cardsToDisplay.length / 2));
  const col2 = cardsToDisplay.slice(Math.ceil(cardsToDisplay.length / 2));

  // Duplicate for seamless infinite CSS scroll loop
  const col1Repeated = [...col1, ...col1, ...col1];
  const col2Repeated = [...col2, ...col2, ...col2];

  return (
    <div className="relative w-full h-[540px] sm:h-[620px] overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-900 shadow-2xl group">
      
      {/* Top & Bottom Edge Gradient Masking for Smooth Fade Effect */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-b from-zinc-950/80 via-transparent to-zinc-950/90" />

      {/* Subtle Grid Accent Background */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-10" />

      {/* Dual Column Container */}
      <div className="grid grid-cols-2 gap-4 p-4 h-full relative z-10">
        
        {/* Column 1: Scrolls Upwards */}
        <div className="flex flex-col gap-4 animate-scroll-up group-hover:[animation-play-state:paused] will-change-transform">
          {col1Repeated.map((card, idx) => (
            <Link
              key={`c1-${card.id}-${idx}`}
              href={card.id.startsWith('pw-') ? '/discover' : `/prompt/${card.id}`}
              className="relative group/card bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700/60 shadow-lg hover:border-indigo-500/80 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="aspect-[4/5] relative w-full overflow-hidden bg-zinc-900">
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent opacity-80 group-hover/card:opacity-95 transition-opacity" />

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                  <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md text-[10px] font-bold text-indigo-300 border border-indigo-500/30 tracking-wide uppercase">
                    {card.tool || 'AI Model'}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Card Title & Creator */}
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <h4 className="text-xs font-bold text-white truncate leading-snug">{card.title}</h4>
                  <p className="text-[10px] font-mono text-zinc-400 mt-0.5">@{card.creator || 'prizom_creator'}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Column 2: Scrolls Downwards */}
        <div className="flex flex-col gap-4 animate-scroll-down group-hover:[animation-play-state:paused] will-change-transform">
          {col2Repeated.map((card, idx) => (
            <Link
              key={`c2-${card.id}-${idx}`}
              href={card.id.startsWith('pw-') ? '/discover' : `/prompt/${card.id}`}
              className="relative group/card bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700/60 shadow-lg hover:border-indigo-500/80 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="aspect-[4/5] relative w-full overflow-hidden bg-zinc-900">
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent opacity-80 group-hover/card:opacity-95 transition-opacity" />

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                  <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md text-[10px] font-bold text-indigo-300 border border-indigo-500/30 tracking-wide uppercase">
                    {card.tool || 'AI Model'}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Card Title & Creator */}
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <h4 className="text-xs font-bold text-white truncate leading-snug">{card.title}</h4>
                  <p className="text-[10px] font-mono text-zinc-400 mt-0.5">@{card.creator || 'prizom_creator'}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>

    </div>
  );
}
