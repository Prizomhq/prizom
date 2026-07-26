'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, Plus } from 'lucide-react';

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

export default function PromptWall({ prompts = [] }: PromptWallProps) {
  const hasRealPrompts = prompts && prompts.length > 0;

  // Repeat real prompts to fill wall
  const cardsToDisplay = hasRealPrompts ? prompts : [];
  
  // Split real prompts into 2 columns for dual inverse scrolling
  const half = Math.ceil(cardsToDisplay.length / 2);
  const col1 = cardsToDisplay.slice(0, half);
  const col2 = cardsToDisplay.slice(half).length > 0 ? cardsToDisplay.slice(half) : col1;

  // Duplicate for seamless infinite CSS scroll loop
  const col1Repeated = [...col1, ...col1, ...col1, ...col1];
  const col2Repeated = [...col2, ...col2, ...col2, ...col2];

  return (
    <div className="relative w-full h-[540px] sm:h-[620px] overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-900 shadow-2xl group">
      
      {/* Top & Bottom Edge Gradient Masking for Smooth Fade Effect */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-b from-zinc-950/80 via-transparent to-zinc-950/90" />

      {/* Subtle Grid Accent Background */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-10" />

      {!hasRealPrompts ? (
        /* Empty State Showcase Card */
        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center relative z-30 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-xs">
            <h3 className="text-base font-bold text-white tracking-tight">No Prompts Cataloged Yet</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Be the first creator to publish a production prompt formula and feature on the live Prompt Wall.
            </p>
          </div>
          <Link
            href="/create"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Publish First Prompt</span>
          </Link>
        </div>
      ) : (
        /* Dual Column Container with Real Production Data */
        <div className="grid grid-cols-2 gap-4 p-4 h-full relative z-10">
          
          {/* Column 1: Scrolls Upwards */}
          <div className="flex flex-col gap-4 animate-scroll-up group-hover:[animation-play-state:paused] will-change-transform">
            {col1Repeated.map((card, idx) => (
              <Link
                key={`c1-${card.id}-${idx}`}
                href={`/prompt/${card.id}`}
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
                    <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md text-[10px] font-bold text-indigo-300 border border-indigo-500/30 tracking-wide uppercase truncate">
                      {card.tool || 'AI Model'}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Card Title & Creator */}
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <h4 className="text-xs font-bold text-white truncate leading-snug">{card.title}</h4>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">@{card.creator || 'creator'}</p>
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
                href={`/prompt/${card.id}`}
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
                    <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md text-[10px] font-bold text-indigo-300 border border-indigo-500/30 tracking-wide uppercase truncate">
                      {card.tool || 'AI Model'}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Card Title & Creator */}
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <h4 className="text-xs font-bold text-white truncate leading-snug">{card.title}</h4>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">@{card.creator || 'creator'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
