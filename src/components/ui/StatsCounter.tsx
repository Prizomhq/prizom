'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Users, Zap, Flame, Award, Heart } from 'lucide-react';

interface StatsCounterProps {
  stats: {
    totalPrompts: number;
    activeCreators: number;
    remixCount: number;
    dailyUploads: number;
    totalCollections: number;
    totalLikes: number;
  };
}

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const increment = Math.ceil(end / (duration / 16)); // ~60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration, mounted]);

  // Keep it server-safe (hydrates as final value, then client animates it from 0)
  return <span>{mounted ? count.toLocaleString() : value.toLocaleString()}</span>;
}

export default function StatsCounter({ stats }: StatsCounterProps) {
  const statItems = [
    {
      label: 'Total Prompts',
      value: stats.totalPrompts,
      icon: BookOpen,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50/50',
      glow: 'group-hover:shadow-indigo-500/10'
    },
    {
      label: 'Active Creators',
      value: stats.activeCreators,
      icon: Users,
      color: 'text-[var(--color-neon-purple)]',
      bgColor: 'bg-purple-50/50',
      glow: 'group-hover:shadow-purple-500/10'
    },
    {
      label: 'Remix Count',
      value: stats.remixCount,
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50/50',
      glow: 'group-hover:shadow-amber-500/10'
    },
    {
      label: 'Daily Created',
      value: stats.dailyUploads,
      icon: Flame,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50/50',
      glow: 'group-hover:shadow-rose-500/10'
    },
    {
      label: 'Total Collections',
      value: stats.totalCollections,
      icon: Award,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50/50',
      glow: 'group-hover:shadow-emerald-500/10'
    },
    {
      label: 'Total Likes',
      value: stats.totalLikes,
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50/50',
      glow: 'group-hover:shadow-pink-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className={`group relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/60 p-5 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[140px] ${item.glow}`}
          >
            {/* Glowing Accent Ring Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-[2rem]" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-zinc-200/5 to-transparent blur-xl pointer-events-none" />

            {/* Header Icon */}
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-2xl ${item.bgColor} ${item.color} transition-transform group-hover:scale-110 duration-300`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            {/* Stats Info */}
            <div className="mt-4">
              <span className="text-[26px] font-black text-zinc-900 tracking-tight leading-none block">
                <AnimatedNumber value={item.value} />
              </span>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mt-1.5 leading-none">
                {item.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
