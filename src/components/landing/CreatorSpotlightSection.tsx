'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Award, 
  CheckCircle, 
  Users, 
  GitFork, 
  ArrowUpRight, 
  Sparkles,
  Heart
} from 'lucide-react';

interface CreatorItem {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  promptsCount?: number;
  followersCount?: number;
  isVerified?: boolean;
}

interface CreatorSpotlightProps {
  creators?: CreatorItem[];
}

const fallbackCreators: CreatorItem[] = [
  {
    id: 'cr-1',
    username: 'elena_art',
    fullName: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
    promptsCount: 42,
    followersCount: 1280,
    isVerified: true
  },
  {
    id: 'cr-2',
    username: 'kenji_design',
    fullName: 'Kenji Takahashi',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
    promptsCount: 68,
    followersCount: 3410,
    isVerified: true
  },
  {
    id: 'cr-3',
    username: 'cyber_vibe',
    fullName: 'Marcus Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop',
    promptsCount: 35,
    followersCount: 920,
    isVerified: true
  },
  {
    id: 'cr-4',
    username: 'vector_lab',
    fullName: 'Sophia Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop',
    promptsCount: 51,
    followersCount: 2150,
    isVerified: true
  }
];

export default function CreatorSpotlightSection({ creators = fallbackCreators }: CreatorSpotlightProps) {
  const displayList = creators.length >= 3 ? creators : fallbackCreators;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full border-t border-zinc-200/80">
      
      {/* Section Header */}
      <div className="text-center space-y-3 mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[11px] font-bold uppercase tracking-wider mx-auto">
          <Award className="w-3.5 h-3.5" />
          Featured Engineers
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
          Top Prompt Creators & Lineage Trees
        </h2>
        <p className="text-zinc-500 font-medium text-sm max-w-xl mx-auto">
          Follow verified creators building open prompt formulas and leading visual style research.
        </p>
      </div>

      {/* Creator Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
        {displayList.slice(0, 4).map((creator) => (
          <Link
            key={creator.id}
            href={`/creator/${creator.username}`}
            className="group bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between space-y-4 text-left"
          >
            <div className="flex items-center gap-3">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.username}
                  className="w-12 h-12 rounded-xl object-cover bg-zinc-100 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
                  {creator.username?.[0]?.toUpperCase() || 'C'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-zinc-900 truncate group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <span>{creator.fullName || creator.username}</span>
                  {creator.isVerified && (
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600 fill-indigo-50 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-mono">@{creator.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl text-center text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Prompts</span>
                <span className="font-bold text-zinc-900">{creator.promptsCount || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Followers</span>
                <span className="font-bold text-zinc-900">{creator.followersCount || 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 pt-1">
              <span>View Profile</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Lineage Feature Highlight Card */}
      <div className="max-w-7xl mx-auto bg-gradient-to-r from-zinc-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-zinc-800 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
            <GitFork className="w-3.5 h-3.5" />
            Automatic Attribution Trees
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Remix Formulas While Honoring Original Authors
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
            Every prompt remix automatically links back to its parent formula, preserving creator credits and mapping the evolution of generative visual styles.
          </p>
        </div>

        <Link
          href="/signup"
          className="px-8 py-4 bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-2xl shadow-md transition-colors shrink-0 flex items-center gap-2"
        >
          <span>Join as a Creator</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

    </section>
  );
}
