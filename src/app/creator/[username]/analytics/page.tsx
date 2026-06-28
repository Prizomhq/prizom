import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { 
  ArrowLeft, 
  Sparkles, 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  Eye,
  Heart,
  Copy,
  Bookmark,
  Zap,
  Activity,
  Award,
  ShieldCheck,
  Check,
  XCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Avatar from '@/components/ui/Avatar';
import CreatorAnalyticsDashboardClient from '@/components/analytics/CreatorAnalyticsDashboardClient';
import { getCreatorVerificationDetails } from '@/app/actions/adminActions';
import { calculateVerificationEligibility } from '@/lib/verification';

export default async function CreatorAnalyticsPage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const username = resolvedParams.username;
  const supabase = await createClient();

  // 1. Get current authenticated user
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    redirect('/login');
  }

  // 2. Fetch target profile
  const { data: creator, error: creatorError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (creatorError || !creator) {
    return notFound();
  }

  // 3. Restrict access to owner only (Security clearance)
  const isOwnProfile = currentUser.id === creator.id;
  if (!isOwnProfile) {
    return (
      <div className="min-h-screen pb-6 md:pb-20 pt-8 bg-[#0a0a0c] flex items-center justify-center relative overflow-hidden text-zinc-100 animate-in fade-in duration-300">
        {/* Shifting Gradient Blurs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[var(--color-neon-purple)]/10 to-red-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-[#121215]/85 rounded-[2.5rem] border border-zinc-800/80 shadow-2xl backdrop-blur-2xl max-w-lg w-full relative z-10 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Lock className="w-10 h-10 animate-bounce" />
          </div>
          
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
            Access Denied
          </span>
          
          <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-wide">Clearance Violation</h3>
          <p className="text-zinc-400 font-semibold text-sm leading-relaxed mb-8 max-w-sm">
            Creator Studio Analytics represent confidential proprietary data. You hold insufficient clearance to view this resource.
          </p>
          
          <Link href={`/creator/${username}`} className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.25)] text-white rounded-full text-xs font-black uppercase tracking-wider hover:-translate-y-0.5 transition-all">
            <ArrowLeft className="w-4 h-4" />
            Return to Profile
          </Link>
        </div>
      </div>
    );
  }

  // 4. Enforce Verified Creator status rules
  const isVerified = creator.badges?.includes('verified');

  if (!isVerified) {
    // Non-verified creator: Render the professional, live locked dashboard state
    // Fetch creator verification statistics securely using the shared Verification service
    const detailsRes = await getCreatorVerificationDetails(creator.id);
    if (!detailsRes.success || !detailsRes.stats) {
      return notFound();
    }

    const verificationProgress = calculateVerificationEligibility(detailsRes.stats);
    if (!verificationProgress) {
      return notFound();
    }

    const { criteria, completedCount, progressPercent, isEligible } = verificationProgress;

    const totalViews = detailsRes.stats.totalViews || 0;

    return (
      <div className="min-h-screen pb-6 md:pb-24 pt-8 bg-[#fcfcfc] text-zinc-900 relative overflow-hidden select-none animate-in fade-in duration-300">
        
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[var(--color-electric-blue)]/5 via-[var(--color-neon-purple)]/5 to-transparent blur-[120px] pointer-events-none -z-10"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
          
          {/* Exit Studio Link */}
          <div className="w-full text-left mb-6">
            <Link href={`/creator/${username}`} className="inline-flex items-center text-zinc-500 hover:text-zinc-900 font-black text-xs uppercase tracking-wider transition-colors group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
              Exit Creator Studio
            </Link>
          </div>

          {/* Locked Dashboard Profile Header */}
          <div className="flex flex-col items-center text-center pb-8 mb-10 w-full border-b border-zinc-200/50">
            <Avatar 
              src={creator.avatar_url} 
              username={creator.username} 
              size="lg" 
              className="mb-4 shadow-xl border-4 border-white shrink-0 animate-in zoom-in-95 duration-200"
            />
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 border border-zinc-255 bg-zinc-100 text-zinc-500 text-[8px] font-black uppercase tracking-widest rounded-md">
                Studio Mode
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-neon-purple)] flex items-center gap-1">
                <Sparkles className="w-3 h-3 shrink-0 animate-pulse" />
                Verification in Progress
              </span>
            </div>
            <h1 className="text-3xl font-black text-zinc-900 mt-2 leading-tight">
              {creator.full_name || creator.username}
            </h1>
            <p className="text-zinc-550 text-xs font-bold uppercase tracking-widest mt-1">@{creator.username}</p>
          </div>

          {/* Redesigned Premium Analytics Stat Grid */}
          <div className="w-full mb-12">
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest text-center mb-6">Creator Analytics</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
              {/* Total Views Card */}
              <div className="bg-white/70 backdrop-blur-md border border-zinc-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 rounded-[2rem] text-center flex flex-col justify-between hover:shadow-[0_20px_40px_rgb(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-300">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Total Views</span>
                <p className="text-3xl font-black text-zinc-900 mt-3">{totalViews.toLocaleString()}</p>
                <span className="text-[9px] text-zinc-400 font-bold uppercase mt-2">Estimated</span>
              </div>

              {/* Total Copies Card */}
              <div className="bg-white/70 backdrop-blur-md border border-zinc-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 rounded-[2rem] text-center flex flex-col justify-between hover:shadow-[0_20px_40px_rgb(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-300">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Total Copies</span>
                <p className="text-3xl font-black text-zinc-900 mt-3">{(detailsRes.stats.totalCopies || 0).toLocaleString()}</p>
                <span className="text-[9px] text-zinc-400 font-bold uppercase mt-2">Copies Target: 1k</span>
              </div>

              {/* Followers Card */}
              <div className="bg-white/70 backdrop-blur-md border border-zinc-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 rounded-[2rem] text-center flex flex-col justify-between hover:shadow-[0_20px_40px_rgb(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-300">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Followers</span>
                <p className="text-3xl font-black text-zinc-900 mt-3">{(detailsRes.stats.followerCount || 0).toLocaleString()}</p>
                <span className="text-[9px] text-zinc-400 font-bold uppercase mt-2">Database growth</span>
              </div>

              {/* Prompts Card */}
              <div className="bg-white/70 backdrop-blur-md border border-zinc-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 rounded-[2rem] text-center flex flex-col justify-between hover:shadow-[0_20px_40px_rgb(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-300">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Prompts</span>
                <p className="text-3xl font-black text-zinc-900 mt-3">{detailsRes.stats.totalPrompts || 0}</p>
                <span className="text-[9px] text-zinc-400 font-bold uppercase mt-2">Prompts Target: 10</span>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-zinc-200/60 my-6"></div>

          {/* Centered Verification Progress Container */}
          <div className="w-full flex flex-col items-center">
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest text-center mb-6">Verification Progress</h2>

            <div className="bg-white/70 backdrop-blur-md border border-zinc-200/50 shadow-[0_20px_50px_rgb(0,0,0,0.05)] rounded-[2.5rem] p-8 w-full max-w-2xl relative overflow-hidden transition-all duration-300 hover:shadow-[0_30px_60px_rgb(0,0,0,0.08)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>
              
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-100 pb-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-[var(--color-neon-purple)]">
                    <Lock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">Verification in Progress</h3>
                    <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Creator Badge Access Checklist</p>
                  </div>
                </div>

                <span className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 shadow-sm self-start sm:self-center">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  Pending Review
                </span>
              </div>

              {/* Progress Tracker (Linear & Circular) */}
              <div className="p-6 bg-zinc-50 border border-zinc-150/40 rounded-3xl flex items-center justify-between gap-6 mb-8">
                <div className="flex-1 space-y-1">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider block">Verification Progress</span>
                  <h4 className="text-3xl font-black text-zinc-900 leading-none tracking-tight">{progressPercent}%</h4>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block mt-1">
                    {completedCount} of 5 Requirements Satisfied
                  </span>

                  {/* Linear Progress bar */}
                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      style={{ width: `${progressPercent}%` }}
                      className={`h-full rounded-full transition-all duration-700 ${
                        isEligible 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                          : 'bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)]'
                      }`}
                    />
                  </div>
                </div>

                {/* Circular indicator */}
                <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="32" stroke="#e4e4e7" strokeWidth="6.5" fill="transparent" />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="32" 
                      stroke={isEligible ? '#10b981' : '#a855f7'} 
                      strokeWidth="6.5" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={2 * Math.PI * 32 * (1 - progressPercent / 100)}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute text-xs font-black text-zinc-900">{progressPercent}%</span>
                </div>
              </div>

              {/* Requirement Checklist */}
              <div className="space-y-3 mb-8">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Requirements Tracker</span>
                <div className="grid grid-cols-1 gap-3">
                  {criteria.map((c) => {
                    const isCheck = c.unlocked;
                    const isNear = c.status === 'near';
                    return (
                      <div key={c.id} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-150/40 rounded-2xl hover:border-zinc-200 transition-colors duration-200">
                        <div className="flex items-center gap-3 min-w-0">
                          {isCheck ? (
                            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                              <Check className="w-4 h-4" />
                            </span>
                          ) : isNear ? (
                            <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0 animate-pulse">
                              <ShieldAlert className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20 shrink-0">
                              <XCircle className="w-4 h-4" />
                            </span>
                          )}
                          <span className="font-extrabold text-sm text-zinc-800 truncate">{c.name}</span>
                        </div>

                        <span className={`text-xs font-black uppercase tracking-wider shrink-0 ${
                          isCheck ? 'text-emerald-600' : isNear ? 'text-amber-600' : 'text-zinc-400'
                        }`}>
                          {c.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Perks List */}
              <div className="p-6 bg-zinc-50 border border-zinc-150/40 rounded-[2rem] space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-[var(--color-neon-purple)] animate-pulse" />
                  What Verified Creators Unlock:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-700 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Full Analytics Panel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Growth Waveform tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Audience Demographics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Creator verification Badge</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  }

  // 5. Query verified creator's prompts to compute actual stats
  const { data: prompts } = await supabase
    .from('prompts')
    .select('id, title, likes_count, copies_count, saves_count, remix_count, views_count, created_at, image_url, category, ai_tool')
    .eq('user_id', creator.id)
    .eq('moderation_status', 'active');

  const promptsList = prompts || [];
  const promptIds = promptsList.map(p => p.id);

  // Compute Likes and Copies sum
  const totalLikes = promptsList.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const totalCopies = promptsList.reduce((sum, p) => sum + (p.copies_count || 0), 0);

  // Fetch Saves count dynamically from prompts list
  const totalSaves = promptsList.reduce((sum, p) => sum + (p.saves_count || 0), 0);

  // Fetch Remixes count dynamically
  let totalRemixes = 0;
  if (promptIds.length > 0) {
    const { count: remixesCount } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .in('remix_of', promptIds);
    totalRemixes = remixesCount || 0;
  }

  // Fetch Views count dynamically
  let totalViews = 0;
  if (promptIds.length > 0) {
    const { count: viewsCount } = await supabase
      .from('prompt_views')
      .select('*', { count: 'exact', head: true })
      .in('prompt_id', promptIds);
    totalViews = viewsCount || 0;
  }

  // Render the upgraded Premium Creator Success Center
  return (
    <CreatorAnalyticsDashboardClient 
      creator={{
        id: creator.id,
        username: creator.username,
        full_name: creator.full_name,
        avatar_url: creator.avatar_url,
        bio: creator.bio,
        follower_count: creator.follower_count || 0,
        following_count: creator.following_count || 0,
        badges: creator.badges || []
      }}
      prompts={promptsList}
      totalLikes={totalLikes}
      totalCopies={totalCopies}
      totalSaves={totalSaves}
      totalRemixes={totalRemixes}
      totalViews={totalViews}
    />
  );
}
