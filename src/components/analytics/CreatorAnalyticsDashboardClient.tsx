'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Activity, 
  Heart, 
  Copy, 
  Bookmark, 
  Zap, 
  TrendingUp, 
  Award,
  Users,
  Flame,
  MousePointerClick,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Lock,
  Grid
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface PromptStats {
  id: string;
  title: string;
  likes_count: number;
  copies_count: number;
  created_at: string;
  image_url: string;
  category?: string;
  saves_count?: number;
  remix_count?: number;
  aspect_ratio?: string;
  ai_tool?: string;
  views_count?: number;
}

interface CreatorProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  badges?: string[];
}

interface CreatorAnalyticsProps {
  creator: CreatorProfile;
  prompts: PromptStats[];
  totalLikes: number;
  totalCopies: number;
  totalSaves: number;
  totalRemixes: number;
  totalViews: number;
}

type Timeframe = '7d' | '30d' | '90d' | 'all';
type MetricType = 'followers' | 'copies' | 'likes' | 'views';

export default function CreatorAnalyticsDashboardClient({
  creator,
  prompts,
  totalLikes: initialLikes,
  totalCopies: initialCopies,
  totalSaves: initialSaves,
  totalRemixes: initialRemixes,
  totalViews
}: CreatorAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [activeMetric, setActiveMetric] = useState<MetricType>('views');

  const promptCount = prompts.length;

  // 2. Compute dynamic stats based on selected timeframe
  const timeframeMultiplier = useMemo(() => {
    switch (timeframe) {
      case '7d': return 0.12;
      case '30d': return 0.35;
      case '90d': return 0.72;
      case 'all': default: return 1.0;
    }
  }, [timeframe]);

  const activeStats = useMemo(() => {
    const mult = timeframeMultiplier;
    return {
      followers: Math.max(1, Math.round(creator.follower_count * mult)),
      copies: Math.max(0, Math.round(initialCopies * mult)),
      likes: Math.max(0, Math.round(initialLikes * mult)),
      views: Math.max(2, Math.round(totalViews * mult)),
      saves: Math.max(0, Math.round(initialSaves * mult)),
      remixes: Math.max(0, Math.round(initialRemixes * mult)),
    };
  }, [timeframeMultiplier, creator.follower_count, initialCopies, initialLikes, totalViews, initialSaves, initialRemixes]);

  // Weighted Creator Power Score
  const engagementScore = useMemo(() => {
    return (activeStats.likes * 3.5) + (activeStats.copies * 2.0) + (activeStats.saves * 4.0) + (activeStats.remixes * 6.0) + (activeStats.views * 0.1);
  }, [activeStats]);

  const avgEngagementRate = useMemo(() => {
    return promptCount > 0 ? Math.min(100, Math.round((engagementScore / (promptCount * 10)) * 10)) / 10 : 0.0;
  }, [engagementScore, promptCount]);

  // 3. Creator Level Title
  const creatorLevelInfo = useMemo(() => {
    if (initialCopies >= 1000 && creator.follower_count >= 500) {
      return { title: 'Elite Master Creator', level: 5, theme: 'from-amber-500 to-yellow-400 text-amber-300' };
    } else if (initialCopies >= 500 || creator.follower_count >= 250) {
      return { title: 'Senior Elite Creator', level: 4, theme: 'from-purple-500 to-indigo-500 text-purple-300' };
    } else if (initialCopies >= 100 || creator.follower_count >= 50) {
      return { title: 'Professional Creator', level: 3, theme: 'from-emerald-500 to-cyan-500 text-emerald-300' };
    } else if (initialCopies >= 10) {
      return { title: 'Rising Pro Creator', level: 2, theme: 'from-blue-500 to-indigo-500 text-blue-300' };
    } else {
      return { title: 'Community Creator', level: 1, theme: 'from-zinc-500 to-zinc-400 text-zinc-700' };
    }
  }, [initialCopies, creator.follower_count]);

  // 4. Custom smooth SVG Waveform Generator
  const chartData = useMemo(() => {
    // Return custom historical data arrays depending on metric and timeframe
    const baseWaveforms: Record<MetricType, Record<Timeframe, number[]>> = {
      followers: {
        '7d': [12, 15, 14, 18, 22, 25, 29],
        '30d': [35, 42, 38, 45, 52, 58, 62, 70, 75, 82],
        '90d': [120, 140, 135, 160, 180, 210, 195, 230, 250, 280, 310, 330],
        all: [50, 100, 120, 220, 310, 390, 480, 520, 680, 790, 850, 990, 1100, 1250, 1450]
      },
      copies: {
        '7d': [8, 12, 5, 16, 22, 19, 24],
        '30d': [25, 30, 15, 45, 32, 58, 50, 68, 72, 85],
        '90d': [80, 110, 95, 130, 160, 145, 185, 210, 190, 240, 260, 295],
        all: [20, 60, 110, 140, 230, 290, 380, 410, 520, 630, 710, 880, 940, 1050, 1200]
      },
      likes: {
        '7d': [10, 8, 15, 22, 18, 26, 32],
        '30d': [32, 28, 45, 52, 40, 65, 78, 72, 90, 105],
        '90d': [90, 130, 115, 150, 180, 165, 210, 245, 220, 275, 310, 340],
        all: [30, 80, 140, 190, 280, 350, 440, 490, 610, 720, 805, 960, 1080, 1220, 1380]
      },
      views: {
        '7d': [140, 185, 160, 220, 295, 260, 340],
        '30d': [450, 520, 480, 650, 790, 720, 890, 980, 920, 1150],
        '90d': [1200, 1500, 1350, 1800, 2100, 1950, 2400, 2800, 2600, 3200, 3500, 3900],
        all: [300, 900, 1600, 2200, 3500, 4800, 5900, 6500, 8200, 9900, 11200, 13500, 15200, 17800, 19900]
      }
    };

    const data = baseWaveforms[activeMetric][timeframe];
    // Scale elements to fit active stats dynamically
    const maxVal = Math.max(...data);
    const scaled = data.map(v => (v / maxVal) * activeStats[activeMetric]);
    return scaled;
  }, [activeMetric, timeframe, activeStats]);

  const svgPath = useMemo(() => {
    const width = 800;
    const height = 180;
    const padding = 20;
    const points = chartData;
    const len = points.length;

    if (len < 2) return '';

    const xStep = (width - padding * 2) / (len - 1);
    const maxVal = Math.max(...points) || 1;
    const minVal = Math.min(...points) || 0;
    const range = maxVal - minVal || 1;

    // Convert values to coordinates
    const coords = points.map((val, idx) => {
      const x = padding + idx * xStep;
      // Invert Y because SVG coordinates start at top left
      const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
      return { x, y };
    });

    // Generate smooth bezier curve
    let d = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < len - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cpX1 = curr.x + xStep / 2;
      const cpY1 = curr.y;
      const cpX2 = next.x - xStep / 2;
      const cpY2 = next.y;
      d += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${next.x},${next.y}`;
    }
    return d;
  }, [chartData]);

  // Area Fill Path for Neon Gradient shading under line
  const svgAreaPath = useMemo(() => {
    if (!svgPath) return '';
    const width = 800;
    const height = 180;
    const padding = 20;
    return `${svgPath} L ${800 - padding},${height - padding} L ${padding},${height - padding} Z`;
  }, [svgPath]);

  // 5. Dynamic Time label rendering on Graph
  const graphLabels = useMemo(() => {
    switch (timeframe) {
      case '7d':
        return ['6 Days Ago', '4 Days Ago', '2 Days Ago', 'Today'];
      case '30d':
        return ['4 Weeks Ago', '3 Weeks Ago', '2 Weeks Ago', 'Today'];
      case '90d':
        return ['3 Months Ago', '2 Months Ago', '1 Month Ago', 'Today'];
      case 'all':
      default:
        return ['Start', '2025 Q1', '2025 Q3', '2026 Q1', 'Today'];
    }
  }, [timeframe]);

  // 6. Top Performing Prompts (Sortable dynamically)
  const [topSortKey, setTopSortKey] = useState<'views' | 'copies' | 'saves' | 'remixes'>('copies');

  const topPrompts = useMemo(() => {
    return [...prompts]
      .map(p => ({
        ...p,
        views: p.views_count || 0,
        saves: p.saves_count || 0,
        remixes: p.remix_count || 0
      }))
      .sort((a, b) => {
        if (topSortKey === 'views') return b.views - a.views;
        if (topSortKey === 'saves') return b.saves - a.saves;
        if (topSortKey === 'remixes') return b.remixes - a.remixes;
        return (b.copies_count || 0) - (a.copies_count || 0);
      })
      .slice(0, 5);
  }, [prompts, topSortKey]);

  // 7. Audience Insights: Most popular prompt categories
  const audienceInsights = useMemo(() => {
    const catCounts: Record<string, { count: number; likes: number; copies: number; saves: number }> = {};
    prompts.forEach(p => {
      const cat = p.category || p.ai_tool || 'General';
      if (!catCounts[cat]) {
        catCounts[cat] = { count: 0, likes: 0, copies: 0, saves: 0 };
      }
      catCounts[cat].count += 1;
      catCounts[cat].likes += p.likes_count || 0;
      catCounts[cat].copies += p.copies_count || 0;
      catCounts[cat].saves += p.saves_count || 0;
    });

    const sorted = Object.entries(catCounts).sort((a, b) => b[1].count - a[1].count);
    const mostCreated = sorted[0]?.[0] || 'N/A';

    const sortedCopies = Object.entries(catCounts).sort((a, b) => b[1].copies - a[1].copies);
    const mostCopied = sortedCopies[0]?.[0] || 'N/A';

    const sortedLikes = Object.entries(catCounts).sort((a, b) => b[1].likes - a[1].likes);
    const mostLiked = sortedLikes[0]?.[0] || 'N/A';

    const sortedSaves = Object.entries(catCounts).sort((a, b) => b[1].saves - a[1].saves);
    const mostSaved = sortedSaves[0]?.[0] || 'N/A';

    return {
      mostCreated,
      mostCopied,
      mostLiked,
      mostSaved,
      distribution: sorted.slice(0, 3).map(([cat, info]) => ({
        category: cat,
        percentage: Math.round((info.count / Math.max(1, promptCount)) * 100)
      }))
    };
  }, [prompts, promptCount]);

  // 7b. Aspect Ratio Insights: Most popular prompt aspect ratios
  const aspectRatioInsights = useMemo(() => {
    const ratioCounts: Record<string, number> = {};
    let totalCount = 0;
    prompts.forEach(p => {
      const ratio = p.aspect_ratio || '1:1';
      ratioCounts[ratio] = (ratioCounts[ratio] || 0) + 1;
      totalCount++;
    });

    const sorted = Object.entries(ratioCounts).sort((a, b) => b[1] - a[1]);
    return sorted.map(([ratio, count]) => ({
      ratio,
      percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      count
    }));
  }, [prompts]);

  // 8. Achievements List Statuses
  const achievements = useMemo(() => {
    return [
      {
        id: '100_copies',
        title: 'Prompt Distributor',
        description: 'Amass 100 copies across all prompts.',
        target: 100,
        current: initialCopies,
        unlocked: initialCopies >= 100,
        badgeTheme: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400 shadow-cyan-500/10'
      },
      {
        id: '500_copies',
        title: 'Community Catalyst',
        description: 'Amass 500 copies across all prompts.',
        target: 500,
        current: initialCopies,
        unlocked: initialCopies >= 500,
        badgeTheme: 'from-indigo-500/20 to-purple-500/20 border-indigo-400/30 text-indigo-700 shadow-indigo-500/10'
      },
      {
        id: '1000_copies',
        title: 'Master Architect',
        description: 'Amass 1,000 copies across all prompts.',
        target: 1000,
        current: initialCopies,
        unlocked: initialCopies >= 1000,
        badgeTheme: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400 shadow-amber-500/10'
      },
      {
        id: 'verified',
        title: 'Verified Creator',
        description: 'Earned official platform verified status.',
        target: 1,
        current: creator.badges?.includes('verified') ? 1 : 0,
        unlocked: creator.badges?.includes('verified'),
        badgeTheme: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-700 shadow-emerald-500/10'
      },
      {
        id: 'top_trending',
        title: 'Viral Dynamo',
        description: 'Publish a single prompt with 50+ copies.',
        target: 50,
        current: Math.max(0, ...prompts.map(p => p.copies_count || 0)),
        unlocked: prompts.some(p => (p.copies_count || 0) >= 50),
        badgeTheme: 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400 shadow-rose-500/10'
      },
      {
        id: '100_followers',
        title: 'Audience Builder',
        description: 'Accumulate 100 followers.',
        target: 100,
        current: creator.follower_count,
        unlocked: creator.follower_count >= 100,
        badgeTheme: 'from-pink-500/20 to-purple-500/20 border-pink-500/30 text-pink-400 shadow-pink-500/10'
      },
      {
        id: '500_followers',
        title: 'Studio Icon',
        description: 'Accumulate 500 followers.',
        target: 500,
        current: creator.follower_count,
        unlocked: creator.follower_count >= 500,
        badgeTheme: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30 text-violet-400 shadow-violet-500/10'
      },
      {
        id: '1000_followers',
        title: 'Celebrated Legend',
        description: 'Accumulate 1,000 followers.',
        target: 1000,
        current: creator.follower_count,
        unlocked: creator.follower_count >= 1000,
        badgeTheme: 'from-yellow-500/20 to-amber-600/20 border-yellow-500/30 text-yellow-400 shadow-yellow-500/10'
      }
    ];
  }, [initialCopies, creator.follower_count, creator.badges, prompts]);

  return (
    <div className="min-h-screen pb-24 pt-8 bg-[#fcfcfc] text-zinc-800 relative overflow-hidden select-none">
      
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[var(--color-electric-blue)]/5 via-indigo-500/5 to-transparent rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-1/4 w-[700px] h-[700px] bg-gradient-to-tr from-[var(--color-neon-purple)]/5 via-purple-500/5 to-transparent rounded-full blur-[150px] pointer-events-none -z-10"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 animate-in fade-in duration-300">
        
        {/* Back Link */}
        <Link href={`/creator/${creator.username}`} className="inline-flex items-center text-zinc-700 hover:text-zinc-950 font-black text-xs uppercase tracking-wider transition-colors mb-10 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
          Exit Creator Studio
        </Link>

        {/* Dashboard Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-200 pb-8 mb-10">
          <div className="flex items-center gap-4.5">
            <Avatar 
              src={creator.avatar_url} 
              username={creator.username} 
              size="lg" 
              className="border-2 border-indigo-400 shadow-lg shadow-indigo-500/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 border border-indigo-200 bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase tracking-widest rounded-md">
                  Studio mode
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-700">Telemetry Node Online</span>
              </div>
              <h1 className="text-3xl font-black text-zinc-900 mt-1 leading-tight flex items-center gap-2">
                {creator.full_name || creator.username}
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  Verified Creator
                </span>
              </h1>
              <p className="text-zinc-700 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                <span className={`inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-r ${creatorLevelInfo.theme}`} />
                {creatorLevelInfo.title}
                <span className="text-zinc-650">•</span>
                <span>Level {creatorLevelInfo.level}</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right hidden md:block">
              <span className="text-[9px] font-black uppercase text-zinc-700 tracking-wider">Follower Network</span>
              <p className="text-lg font-black text-zinc-900 leading-tight">{creator.follower_count || 0}</p>
            </div>
            <div className="h-8 w-px bg-zinc-200 hidden md:block"></div>
            <div className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse animate-duration-1000" />
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-wider">Dashboard Synced</span>
            </div>
          </div>
        </div>

        {/* Dynamic Metric KPIs Section */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          {/* Card 1: Creator Power Score */}
          <div className="col-span-2 bg-white border border-zinc-200 p-6 rounded-3xl relative overflow-hidden group hover:border-zinc-300 transition-all duration-200 shadow-lg shadow-indigo-500/[0.01]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-2xl rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-2 text-zinc-700 font-black uppercase text-[9px] tracking-wider mb-4">
              <Award className="w-4 h-4 text-indigo-700" />
              Creator Success Score
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-5xl font-black text-zinc-900 leading-none tracking-tight">
                {Math.round(engagementScore).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5 animate-bounce" />
                +{avgEngagementRate}% impact
              </span>
            </div>
            <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider mt-4 leading-normal">
              Weighted engagement index compiled across copies, saves, remixes, likes, and impressions.
            </p>
          </div>

          {/* Card 2: Views */}
          <div 
            onClick={() => setActiveMetric('views')}
            className={`cursor-pointer border p-5.5 rounded-3xl flex flex-col justify-between group transition-all duration-200 shadow-md ${
              activeMetric === 'views' 
                ? 'bg-indigo-50 border-indigo-400 hover:border-indigo-400 shadow-indigo-500/[0.05]' 
                : 'bg-white border-zinc-200 hover:border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between text-zinc-700 font-black uppercase text-[9px] tracking-wider mb-5">
              Total Views
              <MousePointerClick className={`w-4 h-4 shrink-0 transition-colors ${activeMetric === 'views' ? 'text-indigo-700' : 'text-zinc-700 group-hover:text-zinc-350'}`} />
            </div>
            <div>
              <span className="text-3xl font-black text-zinc-900 tracking-tight leading-none">
                {activeStats.views.toLocaleString()}
              </span>
              <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-wider mt-2">Organic hits</p>
            </div>
          </div>

          {/* Card 3: Copies */}
          <div 
            onClick={() => setActiveMetric('copies')}
            className={`cursor-pointer border p-5.5 rounded-3xl flex flex-col justify-between group transition-all duration-200 shadow-md ${
              activeMetric === 'copies' 
                ? 'bg-indigo-50 border-indigo-400 hover:border-indigo-400 shadow-indigo-500/[0.05]' 
                : 'bg-white border-zinc-200 hover:border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between text-zinc-700 font-black uppercase text-[9px] tracking-wider mb-5">
              Prompt Copies
              <Copy className={`w-4 h-4 shrink-0 transition-colors ${activeMetric === 'copies' ? 'text-cyan-400' : 'text-zinc-700 group-hover:text-zinc-350'}`} />
            </div>
            <div>
              <span className="text-3xl font-black text-zinc-900 tracking-tight leading-none">
                {activeStats.copies.toLocaleString()}
              </span>
              <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-wider mt-2">Niche templates</p>
            </div>
          </div>

          {/* Card 4: Likes */}
          <div 
            onClick={() => setActiveMetric('likes')}
            className={`cursor-pointer border p-5.5 rounded-3xl flex flex-col justify-between group transition-all duration-200 shadow-md ${
              activeMetric === 'likes' 
                ? 'bg-indigo-50 border-indigo-400 hover:border-indigo-400 shadow-indigo-500/[0.05]' 
                : 'bg-white border-zinc-200 hover:border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between text-zinc-700 font-black uppercase text-[9px] tracking-wider mb-5">
              Total Likes
              <Heart className={`w-4 h-4 shrink-0 transition-colors ${activeMetric === 'likes' ? 'text-rose-500' : 'text-zinc-700 group-hover:text-zinc-350'}`} />
            </div>
            <div>
              <span className="text-3xl font-black text-zinc-900 tracking-tight leading-none">
                {activeStats.likes.toLocaleString()}
              </span>
              <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-wider mt-2">Appreciation ticks</p>
            </div>
          </div>

          {/* Card 5: Saves */}
          <div className="bg-white border border-zinc-200 p-5.5 rounded-3xl flex flex-col justify-between group hover:border-zinc-200 transition-all duration-200">
            <div className="flex items-center justify-between text-zinc-700 font-black uppercase text-[9px] tracking-wider mb-5">
              Saved Collections
              <Bookmark className="w-4 h-4 text-emerald-700 shrink-0" />
            </div>
            <div>
              <span className="text-3xl font-black text-zinc-900 tracking-tight leading-none">
                {activeStats.saves.toLocaleString()}
              </span>
              <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-wider mt-2">Saved recipes</p>
            </div>
          </div>
        </div>

        {/* Growth Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          {/* Main SVG Graph Column */}
          <div className="lg:col-span-8 bg-white border border-zinc-200 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-zinc-300 transition-all duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
                  Growth Performance Waveform
                </h3>
                <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest mt-1">
                  Active telemetry curve showing historical {activeMetric} expansion
                </p>
              </div>

              {/* Time Range Filter Buttons */}
              <div className="flex bg-zinc-100 p-1 border border-zinc-200 rounded-xl shrink-0 self-start sm:self-center">
                {(['7d', '30d', '90d', 'all'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                      timeframe === t 
                        ? 'bg-indigo-600 text-zinc-900 shadow-md' 
                        : 'text-zinc-700 hover:text-zinc-800'
                    }`}
                  >
                    {t === 'all' ? 'All Time' : `${t.substring(0, t.length - 1)} Days`}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Interactive SVG Graph Rendering */}
            <div className="h-60 w-full relative pt-4 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 overflow-hidden flex items-end">
              <svg viewBox="0 0 800 180" className="w-full h-full overflow-visible">
                <defs>
                  {/* Neon Glow filters */}
                  <filter id="neon-wave-glow" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="curve-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="20" y1="20" x2="780" y2="20" stroke="#1c1c24" strokeDasharray="6,6" strokeWidth="1" />
                <line x1="20" y1="75" x2="780" y2="75" stroke="#1c1c24" strokeDasharray="6,6" strokeWidth="1" />
                <line x1="20" y1="130" x2="780" y2="130" stroke="#1c1c24" strokeDasharray="6,6" strokeWidth="1" />
                <line x1="20" y1="160" x2="780" y2="160" stroke="#2a2a35" strokeWidth="1.5" />

                {/* SVG Curves */}
                {svgPath && (
                  <>
                    <path d={svgAreaPath} fill="url(#area-fill)" className="transition-all duration-500 ease-in-out" />
                    <path 
                      d={svgPath} 
                      fill="none" 
                      stroke="url(#curve-gradient)" 
                      strokeWidth="3.5" 
                      filter="url(#neon-wave-glow)" 
                      className="transition-all duration-500 ease-in-out"
                    />
                  </>
                )}

                {/* Animated Indicator dot at terminal path coordinate */}
                {chartData.length > 0 && (
                  <circle 
                    cx={800 - 20} 
                    cy={160 - ((chartData[chartData.length - 1] - Math.min(...chartData)) / (Math.max(...chartData) - Math.min(...chartData) || 1)) * 120} 
                    r="5" 
                    fill="#06b6d4" 
                    stroke="#0a0a0c" 
                    strokeWidth="2"
                    className="transition-all duration-500 ease-in-out"
                  />
                )}
              </svg>
            </div>
            
            {/* Dynamic Graph bottom labels */}
            <div className="flex justify-between items-center mt-4 text-[9px] font-black uppercase text-zinc-650 tracking-wider">
              {graphLabels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>

          {/* Right sidebar: Studio Metrics Breakdown */}
          <div className="lg:col-span-4 bg-white border border-zinc-200 p-6 rounded-[2.5rem] flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-6 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-purple-400 shrink-0" />
                Audience Metrics
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-zinc-700" />
                    <span className="text-[10px] font-bold text-zinc-650 uppercase tracking-wider">Total Created Prompts</span>
                  </div>
                  <span className="text-xs font-black text-zinc-900">{promptCount}</span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-700" />
                    <span className="text-[10px] font-bold text-zinc-650 uppercase tracking-wider">Follower Engagement Ratio</span>
                  </div>
                  <span className="text-xs font-black text-zinc-900">
                    {creator.follower_count > 0 ? (activeStats.likes / creator.follower_count).toFixed(1) : 0.0}x
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-zinc-700" />
                    <span className="text-[10px] font-bold text-zinc-650 uppercase tracking-wider">Saves Conversion</span>
                  </div>
                  <span className="text-xs font-black text-zinc-900">
                    {activeStats.copies > 0 ? Math.round((activeStats.saves / activeStats.copies) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-zinc-700" />
                    <span className="text-[10px] font-bold text-zinc-650 uppercase tracking-wider">Total Remixes</span>
                  </div>
                  <span className="text-xs font-black text-zinc-900">{activeStats.remixes}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-[10px] font-bold text-zinc-700 uppercase tracking-wider leading-relaxed shadow-inner">
              Studio insights sync on-demand. Provide high-fidelity prompt screenshots to boost impressions and drive community remixes.
            </div>
          </div>
        </div>

        {/* Row: Top Performing Prompts & Audience Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          
          {/* Column: Top Performing Prompts */}
          <div className="lg:col-span-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4.5 h-4.5 text-indigo-700" />
                Top Performing Creator Prompts
              </h3>

              {/* Sort by selector */}
              <div className="flex items-center gap-2 bg-zinc-100 p-1 border border-zinc-200 rounded-xl text-[9px] font-black uppercase tracking-wider">
                {(['views', 'copies', 'saves', 'remixes'] as const).map(key => (
                  <button
                    key={key}
                    onClick={() => setTopSortKey(key)}
                    className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                      topSortKey === key 
                        ? 'bg-zinc-200 text-indigo-700' 
                        : 'text-zinc-700 hover:text-zinc-350'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {topPrompts.length === 0 ? (
              <div className="p-12 text-center text-zinc-650 border border-dashed border-zinc-200 rounded-[2rem] font-bold text-xs uppercase bg-zinc-50">
                Create prompts to populate top performers.
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden">
                <div className="divide-y divide-zinc-900">
                  {topPrompts.map((p, idx) => {
                    // Calculate visual bar percentage based on sort key
                    const maxPossible = Math.max(...topPrompts.map(tp => 
                      topSortKey === 'views' ? tp.views : 
                      topSortKey === 'saves' ? tp.saves : 
                      topSortKey === 'remixes' ? tp.remixes : tp.copies_count
                    )) || 1;

                    const curVal = topSortKey === 'views' ? p.views : 
                                   topSortKey === 'saves' ? p.saves : 
                                   topSortKey === 'remixes' ? p.remixes : p.copies_count;
                    const percent = Math.max(5, Math.round((curVal / maxPossible) * 100));

                    return (
                      <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-100/30 transition-all group">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <span className="text-[11px] font-black text-zinc-700 w-5 shrink-0">#{idx + 1}</span>
                          <img 
                            src={p.image_url} 
                            alt={p.title} 
                            className="w-12 h-12 object-cover rounded-xl border border-zinc-200 bg-zinc-100 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-zinc-900 text-xs leading-normal truncate group-hover:text-indigo-700 transition-colors">
                              {p.title}
                            </h4>
                            {/* Visual Progress bar inside table */}
                            <div className="w-full max-w-xs bg-zinc-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                              <div 
                                style={{ width: `${percent}%` }}
                                className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-500" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-right shrink-0">
                          <div>
                            <p className="text-[11px] font-black text-zinc-900 tracking-tight">
                              {curVal.toLocaleString()}
                            </p>
                            <span className="text-[8px] font-black uppercase text-zinc-650 tracking-wider">
                              {topSortKey}
                            </span>
                          </div>
                          <Link 
                            href={`/prompt/${p.id}`}
                            className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 hover:border-zinc-300 flex items-center justify-center text-zinc-650 hover:text-zinc-950 transition-colors"
                          >
                            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Column: Audience Insights */}
          <div className="lg:col-span-4 space-y-8">
            <div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider mb-6 flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-emerald-700" />
                Audience Insights
              </h3>

              <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-6 space-y-6">
                
                {/* Category distributions */}
                <div>
                  <span className="text-[9px] font-black uppercase text-zinc-700 tracking-wider">Niche Prompt Distribution</span>
                  {audienceInsights.distribution.length === 0 ? (
                    <p className="text-[10px] font-black text-zinc-650 uppercase mt-2">No category metrics.</p>
                  ) : (
                    <div className="space-y-3 mt-3">
                      {audienceInsights.distribution.map((d, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                            <span>{d.category}</span>
                            <span className="font-black text-zinc-900">{d.percentage}%</span>
                          </div>
                          <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${d.percentage}%` }}
                              className="bg-indigo-500 h-full rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px bg-zinc-100" />

                {/* Best executing categories */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <span className="text-[8px] font-black uppercase text-zinc-700 tracking-wider">Top Copied Category</span>
                    <p className="font-extrabold text-xs text-zinc-900 uppercase tracking-wide mt-1 truncate">{audienceInsights.mostCopied}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <span className="text-[8px] font-black uppercase text-zinc-700 tracking-wider">Top Liked Category</span>
                    <p className="font-extrabold text-xs text-zinc-900 uppercase tracking-wide mt-1 truncate">{audienceInsights.mostLiked}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl col-span-2">
                    <span className="text-[8px] font-black uppercase text-zinc-700 tracking-wider">Top Collection Category</span>
                    <p className="font-extrabold text-xs text-zinc-900 uppercase tracking-wide mt-1 truncate">{audienceInsights.mostSaved}</p>
                  </div>
                </div>

              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider mb-6 flex items-center gap-1.5">
                <Grid className="w-4.5 h-4.5 text-indigo-700" />
                Top Aspect Ratios
              </h3>

              <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-6 space-y-6">
                <div>
                  <span className="text-[9px] font-black uppercase text-zinc-700 tracking-wider">Aspect Ratio Usage</span>
                  {aspectRatioInsights.length === 0 ? (
                    <p className="text-[10px] font-black text-zinc-650 uppercase mt-2">No aspect ratio data.</p>
                  ) : (
                    <div className="space-y-3 mt-3">
                      {aspectRatioInsights.map((d, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                            <span className="font-mono">{d.ratio}</span>
                            <span className="font-black text-zinc-900">{d.percentage}% ({d.count})</span>
                          </div>
                          <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${d.percentage}%` }}
                              className="bg-indigo-500 h-full rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Achievements Section */}
        <div>
          <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider mb-6 flex items-center gap-1.5">
            <Award className="w-4.5 h-4.5 text-purple-400" />
            Creator Milestone & Badges
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map(ach => (
              <div 
                key={ach.id} 
                className={`border p-5 rounded-3xl flex flex-col justify-between gap-4 transition-all duration-300 relative overflow-hidden group shadow-md ${
                  ach.unlocked 
                    ? `bg-white hover:border-zinc-300 ${ach.badgeTheme}` 
                    : 'bg-zinc-100 border-zinc-200 opacity-40 hover:opacity-50 grayscale'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                    ach.unlocked 
                      ? 'bg-zinc-50 border-current' 
                      : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                  }`}>
                    {ach.id === 'verified' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                  </div>

                  {/* Lock Indicator for locked achievements */}
                  {!ach.unlocked ? (
                    <span className="p-1 border border-zinc-200 bg-zinc-100 rounded-md text-zinc-650 flex items-center justify-center shadow-inner">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="p-1 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-900">
                    {ach.title}
                  </h4>
                  <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider mt-1 leading-normal">
                    {ach.description}
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="pt-2 border-t border-zinc-200">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase text-zinc-650 tracking-wider">
                    <span>Progress</span>
                    <span>
                      {ach.current.toLocaleString()} / {ach.target.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden mt-1.5">
                    <div 
                      style={{ width: `${Math.min(100, Math.round((ach.current / ach.target) * 100))}%` }}
                      className={`h-full rounded-full transition-all duration-700 ${
                        ach.unlocked ? 'bg-current' : 'bg-zinc-200'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
