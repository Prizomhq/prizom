'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Wand2, GitCompare, FolderKanban, History, Coins } from 'lucide-react';
import PrizomLogo from '@/components/ui/PrizomLogo';

export interface StudioSubNavProps {
  creditBalance?: number;
}

export function StudioSubNav({ creditBalance = 10 }: StudioSubNavProps) {
  const pathname = usePathname() || '/studio';

  const NAV_ITEMS = [
    {
      href: '/studio',
      label: 'Image to Prompt',
      icon: Sparkles,
      active: pathname === '/studio' || pathname === '/create/studio' || pathname.startsWith('/studio/reverse')
    },
    {
      href: '/studio/optimize',
      label: 'Prompt Optimizer',
      icon: Wand2,
      active: pathname.startsWith('/studio/optimize')
    },
    {
      href: '/studio/compare',
      label: 'Prompt Compare',
      icon: GitCompare,
      active: pathname.startsWith('/studio/compare')
    },
    {
      href: '/studio/projects',
      label: 'Projects & Drafts',
      icon: FolderKanban,
      active: pathname.startsWith('/studio/projects')
    },
    {
      href: '/studio/history',
      label: 'History & Telemetry',
      icon: History,
      active: pathname.startsWith('/studio/history')
    }
  ];

  return (
    <header className="w-full bg-zinc-950 border-b border-zinc-800/80 sticky top-16 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Application Title */}
          <div className="flex items-center gap-3">
            <Link href="/studio" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center transition-all group-hover:scale-105">
                <PrizomLogo size={18} />
              </div>
              <span className="text-sm font-extrabold text-white tracking-tight">AI Studio</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase tracking-wider">
                V2 Enterprise
              </span>
            </Link>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    item.active
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.active ? 'text-purple-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Credit Pill */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{creditBalance} Credits</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
