import Link from 'next/link';
import { ArrowLeft, Sparkles, Image as ImageIcon, Zap, AlignLeft, BadgeCheck, ShieldAlert, GitFork } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PromptActions from '@/components/ui/PromptActions';
import CopyButton from '@/components/ui/CopyButton';
import { checkInteractionStatus, recordPromptViewAction } from '@/app/actions/interactions';
import FollowButton from '@/components/ui/FollowButton';
import { checkIsFollowing } from '@/app/actions/follows';
import Avatar from '@/components/ui/Avatar';
import { getOptimizedImageUrl } from '@/lib/cloudinary-client';
import { getPublicCMS } from '@/app/actions/adminActions';
import RelatedPromptsFeed from '@/components/ui/RelatedPromptsFeed';
import { Metadata } from 'next';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = await createAdminClient();
  
  const { data: prompt } = await supabase
    .from('prompts')
    .select('title, description, image_url, profiles!user_id(username)')
    .eq('id', resolvedParams.id)
    .maybeSingle();

  if (!prompt) {
    return {
      title: 'Prompt Not Found | Prizom',
    };
  }

  const profilesData = prompt.profiles;
  const creatorProfile = Array.isArray(profilesData) ? profilesData[0] : profilesData;
  const creatorName = creatorProfile?.username ? `@${creatorProfile.username}` : 'unknown';
  const title = `"${prompt.title}" by ${creatorName} | Prizom`;
  const description = prompt.description || `Discover "${prompt.title}" on Prizom, the collaborative AI prompt registry.`;
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prizom.com';
  const canonicalUrl = `${siteUrl}/prompt/${resolvedParams.id}`;
  const ogImage = prompt.image_url || `${siteUrl}/og-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Prizom',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: prompt.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // Fetch current viewer role to restrict access
  let isCurrentUserAdmin = false;
  if (user) {
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isCurrentUserAdmin = ['super_admin', 'admin', 'moderator'].includes(currentUserProfile?.role || '');
  }

  // Fetch the prompt by ID including its creator
  const { data: prompt, error } = await supabase
    .from('prompts')
    .select('*, profiles!user_id(username, full_name, avatar_url, role, badges)')
    .eq('id', resolvedParams.id)
    .maybeSingle();

  // Handle missing prompts
  if (error || !prompt) {
    return (
      <div className="min-h-screen pb-6 md:pb-20 pt-8 bg-[#fcfcfc] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-3xl border border-zinc-200 shadow-sm mt-8 max-w-lg w-full">
          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-100">
            <ImageIcon className="w-10 h-10 text-zinc-300 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 mb-2">Prompt Not Found</h3>
          <p className="text-zinc-500 mb-8">This prompt may have been deleted, or the URL might be incorrect.</p>
          <Link href="/discover" className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-white transition-all duration-200 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] rounded-full hover:shadow-[0_8px_25px_rgba(168,85,247,0.3)] hover:-translate-y-0.5">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  // Intercept if prompt is hidden by moderation
  const isHidden = prompt.moderation_status === 'pending_deletion';
  if (isHidden && !isCurrentUserAdmin) {
    return (
      <div className="min-h-screen pb-6 md:pb-20 pt-8 bg-[#0a0a0c] flex items-center justify-center relative overflow-hidden text-zinc-100 animate-in fade-in duration-300">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-red-500/10 to-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-[#121215]/85 rounded-[2.5rem] border border-zinc-800/80 shadow-2xl backdrop-blur-2xl max-w-lg w-full relative z-10 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-10 h-10 animate-pulse" />
          </div>
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
            Content Restricted
          </span>
          <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-wide">Prompt Restricted</h3>
          <p className="text-zinc-400 font-semibold text-sm leading-relaxed mb-8 max-w-sm">
            This original prompt was hidden by the platform due to community guideline or policy violations.
          </p>
          <Link href="/discover" className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-[0_8px_25px_rgba(239,68,68,0.25)] text-white rounded-full text-xs font-black uppercase tracking-wider hover:-translate-y-0.5 transition-all">
            <ArrowLeft className="w-4 h-4" />
            Return to Discover Feed
          </Link>
        </div>
      </div>
    );
  }

  const isOwnerSuspendedOrBanned = ['suspended', 'banned', 'permanently_banned', 'disabled'].includes(prompt.profiles?.role || '');
  if (isOwnerSuspendedOrBanned && !isCurrentUserAdmin) {
    return (
      <div className="min-h-screen pb-6 md:pb-20 pt-8 bg-[#0a0a0c] flex items-center justify-center relative overflow-hidden text-zinc-100 animate-in fade-in duration-300">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-red-500/10 to-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-[#121215]/85 rounded-[2.5rem] border border-zinc-800/80 shadow-2xl backdrop-blur-2xl max-w-lg w-full relative z-10 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-10 h-10 animate-pulse" />
          </div>
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
            Content Restricted
          </span>
          <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-wide">Account Suspended</h3>
          <p className="text-zinc-400 font-semibold text-sm leading-relaxed mb-8 max-w-sm">
            Content unavailable due to account moderation.
          </p>
          <Link href="/discover" className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-[0_8px_25px_rgba(239,68,68,0.25)] text-white rounded-full text-xs font-black uppercase tracking-wider hover:-translate-y-0.5 transition-all">
            <ArrowLeft className="w-4 h-4" />
            Return to Discover Feed
          </Link>
        </div>
      </div>
    );
  }

  // Record prompt view (IP/user cooldown verified)
  await recordPromptViewAction(prompt.id);

  // Fetch downstream remixes of this prompt using parent_prompt_id to survive deletion
  const remixesQuery = supabase
    .from('prompts')
    .select('*, profiles!user_id(username, full_name, avatar_url, role, badges)')
    .eq('parent_prompt_id', prompt.id)
    .order('created_at', { ascending: false });

  // hiddenPrompts filter removed (handled by RLS)
  const { data: remixes } = await remixesQuery;

  // Fetch user interaction state
  const { isLiked, isSaved } = await checkInteractionStatus(prompt.id);

  let isFollowing = false;
  if (isLoggedIn && user.id !== prompt.user_id) {
    isFollowing = await checkIsFollowing(prompt.user_id);
  }

  // Fetch parent details using admin client to see moderated/archived states
  let parentPrompt = null;
  let parentStatus: 'active' | 'moderated' | 'archived' | 'deleted' = 'active';

  if (prompt.parent_prompt_id) {
    const adminSupabase = await createAdminClient();
    const { data: pData } = await adminSupabase
      .from('prompts')
      .select('*, profiles!user_id(username, full_name, avatar_url, role, badges)')
      .eq('id', prompt.parent_prompt_id)
      .maybeSingle();

    if (pData) {
      parentPrompt = pData;
      if (pData.moderation_status === 'pending_deletion') {
        parentStatus = 'moderated';
      } else {
        parentStatus = 'active';
      }
    } else {
      // Not in prompts, check archived_prompts
      const { data: archData } = await adminSupabase
        .from('archived_prompts')
        .select('*')
        .eq('id', prompt.parent_prompt_id)
        .maybeSingle();

      if (archData) {
        parentPrompt = {
          id: archData.id,
          title: archData.title,
          profiles: {
            username: archData.creator_username,
            avatar_url: archData.creator_avatar_url || null,
            badges: []
          }
        };
        if (archData.moderation_reason) {
          parentStatus = 'moderated';
        } else {
          parentStatus = 'archived';
        }
      } else {
        parentStatus = 'deleted';
      }
    }
  }

  // Fetch original root details using admin client to see moderated/archived states
  let originalRootPrompt = null;
  let originalRootStatus: 'active' | 'moderated' | 'archived' | 'deleted' = 'active';

  if (prompt.original_root_id && prompt.original_root_id !== prompt.id && prompt.original_root_id !== prompt.parent_prompt_id) {
    const adminSupabase = await createAdminClient();
    const { data: rData } = await adminSupabase
      .from('prompts')
      .select('*, profiles!user_id(username, full_name, avatar_url, role, badges)')
      .eq('id', prompt.original_root_id)
      .maybeSingle();

    if (rData) {
      originalRootPrompt = rData;
      if (rData.moderation_status === 'pending_deletion') {
        originalRootStatus = 'moderated';
      } else {
        originalRootStatus = 'active';
      }
    } else {
      // Check archived_prompts
      const { data: archData } = await adminSupabase
        .from('archived_prompts')
        .select('*')
        .eq('id', prompt.original_root_id)
        .maybeSingle();

      if (archData) {
        originalRootPrompt = {
          id: archData.id,
          title: archData.title,
          profiles: {
            username: archData.creator_username,
            avatar_url: archData.creator_avatar_url || null,
            badges: []
          }
        };
        if (archData.moderation_reason) {
          originalRootStatus = 'moderated';
        } else {
          originalRootStatus = 'archived';
        }
      } else {
        originalRootStatus = 'deleted';
      }
    }
  }

  let ratioClass = 'aspect-square';
  if (prompt.aspect_ratio === '16:9') ratioClass = 'aspect-video';
  else if (prompt.aspect_ratio === '4:5') ratioClass = 'aspect-[4/5]';
  else if (prompt.aspect_ratio === '3:4') ratioClass = 'aspect-[3/4]';
  else if (prompt.aspect_ratio === '9:16') ratioClass = 'aspect-[9/16]';
  else if (prompt.aspect_ratio === '2:3') ratioClass = 'aspect-[2/3]';
  else if (prompt.aspect_ratio === '3:2') ratioClass = 'aspect-[3/2]';
  else if (prompt.aspect_ratio === '21:9') ratioClass = 'aspect-[21/9]';

  return (
    <div className="min-h-screen pb-6 md:pb-24 pt-8 bg-[#fcfcfc] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[var(--color-electric-blue)]/5 via-[var(--color-neon-purple)]/5 to-transparent rounded-full blur-[100px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Back navigation */}
        <Link href="/discover" className="inline-flex items-center text-zinc-500 hover:text-zinc-900 font-bold transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Discover
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Image & Details (Sticky Left) */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24 h-fit">
            <div className="rounded-[2.5rem] overflow-hidden border border-zinc-200/60 bg-white/50 backdrop-blur-xl shadow-xl shadow-zinc-200/20 p-2 relative group">
              <div className={`rounded-[2rem] overflow-hidden relative bg-zinc-100 w-full ${ratioClass}`}>
                {prompt.image_url ? (
                  <img 
                    src={getOptimizedImageUrl(prompt.image_url, 'detail')} 
                    alt={prompt.title} 
                    className="w-full h-full object-cover max-h-[75vh]"
                    fetchPriority="high"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-purple-600/[0.08] to-blue-600/[0.04] flex flex-col justify-between p-10 relative select-none min-h-[400px]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/[0.03] via-transparent to-transparent pointer-events-none" />
                    
                    {/* Top row */}
                    <div className="flex justify-between items-start">
                      <span className="px-3 py-1.5 rounded-full bg-zinc-900/5 text-xs font-black uppercase tracking-wider text-zinc-650 border border-zinc-900/5 backdrop-blur-xs">
                        {prompt.ai_tool}
                      </span>
                      <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    </div>
                    
                    {/* Middle: Title & Category */}
                    <div className="my-auto py-8">
                      <span className="block text-xs font-black text-indigo-500 uppercase tracking-widest mb-2">{prompt.category}</span>
                      <h4 className="text-2xl font-black text-zinc-800 tracking-tight leading-snug uppercase">
                        {prompt.title}
                      </h4>
                    </div>

                    {/* Bottom: Registry label */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <span>Collaborative Prompt Registry</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-md border border-zinc-200/50 p-3 sm:p-4 rounded-3xl shadow-sm gap-3">
              {prompt.profiles ? (
                <Link href={`/creator/${prompt.profiles.username}`} className="flex items-center space-x-3 group min-w-0 flex-1">
                  <Avatar 
                    src={prompt.profiles.avatar_url} 
                    username={prompt.profiles.username} 
                    size="lg" 
                    className="group-hover:shadow-md group-hover:-translate-y-0.5 shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-zinc-900 text-base sm:text-lg group-hover:text-[var(--color-neon-purple)] transition-colors leading-tight flex items-center gap-1">
                      <span className="truncate">{prompt.profiles.full_name || prompt.profiles.username}</span>
                      {prompt.profiles.badges?.includes('verified') && (
                        <span title="Verified Creator" className="shrink-0"><BadgeCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-500 fill-blue-500/10" /></span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-zinc-500 font-bold leading-tight truncate">@{prompt.profiles.username}</div>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center space-x-4">
                  <Avatar 
                    src={null} 
                    username="?" 
                    size="lg" 
                    className="opacity-60 bg-zinc-200" 
                  />
                  <div>
                    <div className="font-black text-zinc-400 text-lg leading-tight">
                      Deleted Creator
                    </div>
                    <div className="text-sm text-zinc-400 font-bold leading-tight">@deleted_creator</div>
                  </div>
                </div>
              )}
              {(!isLoggedIn || user.id !== prompt.user_id) && (
                <FollowButton 
                  targetId={prompt.user_id} 
                  initialIsFollowing={isFollowing} 
                  isLoggedIn={isLoggedIn} 
                />
              )}
            </div>
          </div>

          {/* Right Column: Prompt Info & Actions */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/60 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-xl shadow-zinc-200/20">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Link href={`/discover?tool=${prompt.ai_tool}`} className="px-4 py-1.5 rounded-full bg-[var(--color-neon-purple)]/10 hover:bg-[var(--color-neon-purple)]/20 text-[var(--color-neon-purple)] text-xs font-black uppercase tracking-wider border border-[var(--color-neon-purple)]/20 transition-colors">
                    {prompt.ai_tool}
                  </Link>
                  <Link href={`/discover?category=${prompt.category}`} className="px-4 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-black uppercase tracking-wider border border-zinc-200 transition-colors">
                    {prompt.category}
                  </Link>
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 text-zinc-900 leading-[1.1] tracking-tight break-words">{prompt.title}</h1>
                
                {prompt.description && (
                  <p className="text-lg text-zinc-500 font-medium leading-relaxed mb-6">
                    {prompt.description}
                  </p>
                )}

                <div className="pt-6 border-t border-zinc-100/80">
                  <PromptActions 
                    promptId={prompt.id}
                    promptTitle={prompt.title}
                    initialLikes={prompt.likes_count}
                    initialSaves={prompt.saves_count}
                    initialIsLiked={isLiked}
                    initialIsSaved={isSaved}
                    isLoggedIn={isLoggedIn}
                    isOwner={!!(user && user.id === prompt.user_id)}
                  />
                </div>
              </div>

              {/* Tags */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-100">
                  {prompt.tags.map((tag: string) => (
                    <Link key={tag} href={`/discover?tag=${tag}`} className="px-4 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 text-sm text-zinc-600 font-bold transition-all shadow-sm hover:border-[var(--color-electric-blue)] hover:text-[var(--color-electric-blue)]">
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Remix Notes Card */}
            {prompt.remix_notes && (
              <div className="bg-gradient-to-r from-purple-50/[0.3] to-blue-50/[0.3] border border-purple-100 rounded-[2rem] p-6 shadow-sm">
                <h4 className="text-sm font-black text-[var(--color-neon-purple)] uppercase tracking-widest mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-1.5 text-[var(--color-neon-purple)] animate-pulse" />
                  Remix Notes
                </h4>
                <p className="text-zinc-700 text-sm leading-relaxed font-semibold">"{prompt.remix_notes}"</p>
              </div>
            )}

            {/* Prompt Box */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 relative group border border-zinc-200/60 shadow-xl shadow-zinc-200/20">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h3 className="text-xl sm:text-2xl font-black flex items-center text-zinc-900">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-[var(--color-neon-purple)] shrink-0" />
                  The Prompt
                </h3>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {prompt.negative_prompt && (
                    <CopyButton 
                      textToCopy={`[PROMPT]\n${prompt.prompt_text}\n\n[NEGATIVE PROMPT]\n${prompt.negative_prompt}`} 
                      promptId={prompt.id}
                      label="Copy Generation Pack"
                      successLabel="Pack Copied!"
                    />
                  )}
                  <CopyButton textToCopy={prompt.prompt_text} promptId={prompt.id} />
                </div>
              </div>
              <div className="bg-zinc-50/80 rounded-2xl p-6 text-zinc-800 font-mono text-sm leading-relaxed border border-zinc-200/50 shadow-inner max-h-[400px] overflow-y-auto break-words whitespace-pre-wrap overflow-x-hidden">
                {prompt.prompt_text}
              </div>
            </div>

            {/* Negative Prompt */}
            {prompt.negative_prompt && (
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-zinc-200/60 shadow-xl shadow-zinc-200/20">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <h3 className="text-xl sm:text-2xl font-black flex items-center text-zinc-900">
                    <AlignLeft className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-red-500 shrink-0" />
                    Negative Prompt
                  </h3>
                  <CopyButton textToCopy={prompt.negative_prompt} promptId={prompt.id} label="Copy Negative" successLabel="Negative Copied!" />
                </div>
                <div className="bg-red-50/50 rounded-2xl p-6 text-red-900/80 font-mono text-sm leading-relaxed border border-red-100 shadow-inner break-words whitespace-pre-wrap overflow-x-hidden">
                  {prompt.negative_prompt}
                </div>
              </div>
            )}

            {/* Remix Ancestry Tree */}
            {(prompt.parent_prompt_id || prompt.original_root_id) && (
              <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/60 rounded-[2rem] p-6 shadow-sm mb-4">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-1.5">
                  <GitFork className="w-4 h-4 text-[var(--color-neon-purple)] rotate-180" />
                  Remix Lineage Tree
                </h4>
                
                <div className="relative pl-6 space-y-6">
                  {/* Vertical connecting line */}
                  <div className="absolute left-2.5 top-2.5 bottom-2.5 w-[2px] bg-gradient-to-b from-purple-200 via-indigo-200 to-blue-200"></div>

                  {/* 1. Original Root Prompt (if exists and is distinct from parent) */}
                  {originalRootPrompt && (
                    <div className="relative flex items-start gap-4">
                      {/* Node circle */}
                      <div className="absolute -left-[20px] w-[10px] h-[10px] rounded-full bg-purple-500 ring-4 ring-purple-100 z-10 top-1.5"></div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[9px] font-black text-purple-600 uppercase tracking-widest">Original Root</span>
                        {originalRootStatus === 'moderated' ? (
                          <p className="text-xs font-bold text-red-500 italic mt-0.5">Content restricted by moderation</p>
                        ) : originalRootStatus === 'deleted' ? (
                          <p className="text-xs font-bold text-zinc-400 italic mt-0.5">Prompt deleted</p>
                        ) : (
                          <div className="flex items-center gap-2 mt-0.5 min-w-0 w-full">
                            <Link href={`/prompt/${originalRootPrompt.id}`} className="text-sm font-bold text-zinc-800 hover:text-[var(--color-neon-purple)] transition-colors truncate hover:underline min-w-0 flex-1">
                              "{originalRootPrompt.title}"
                            </Link>
                            <span className="text-xs text-zinc-400 shrink-0">by @{originalRootPrompt.profiles?.username || 'unknown'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. Parent Prompt (if exists) */}
                  {prompt.parent_prompt_id && (
                    <div className="relative flex items-start gap-4">
                      {/* Node circle */}
                      <div className="absolute -left-[20px] w-[10px] h-[10px] rounded-full bg-indigo-500 ring-4 ring-indigo-100 z-10 top-1.5"></div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[9px] font-black text-indigo-650 uppercase tracking-widest">Parent Prompt</span>
                        {parentStatus === 'moderated' ? (
                          <p className="text-xs font-bold text-red-500 italic mt-0.5">Content restricted by moderation</p>
                        ) : parentStatus === 'deleted' ? (
                          <p className="text-xs font-bold text-zinc-400 italic mt-0.5">Prompt deleted</p>
                        ) : (
                          <div className="flex items-center gap-2 mt-0.5 min-w-0 w-full">
                            <Link href={`/prompt/${parentPrompt.id}`} className="text-sm font-bold text-zinc-800 hover:text-[var(--color-neon-purple)] transition-colors truncate hover:underline min-w-0 flex-1">
                              "{parentPrompt.title}"
                            </Link>
                            <span className="text-xs text-zinc-400 shrink-0">by @{parentPrompt.profiles?.username || 'unknown'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Current Prompt */}
                  <div className="relative flex items-start gap-4">
                    {/* Node circle (glowing) */}
                    <div className="absolute -left-[22px] w-[14px] h-[14px] rounded-full bg-[var(--color-electric-blue)] ring-4 ring-blue-100 animate-pulse z-10 top-1"></div>
                    <div className="flex-1 min-w-0 bg-blue-50/40 border border-blue-100/30 rounded-2xl p-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black text-blue-700 bg-blue-50 uppercase tracking-wider mb-1">
                        You Are Here
                      </span>
                      <h5 className="text-sm font-black text-zinc-900 truncate">"{prompt.title}"</h5>
                      <p className="text-[10px] text-zinc-450 font-bold uppercase mt-1">Current Version</p>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

        {/* Downstream Remixes variations gallery */}
        {remixes && remixes.length > 0 && (
          <div className="mt-16 pt-12 border-t border-zinc-200/60">
            <div className="mb-8">
              <h3 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center">
                <Zap className="w-7 h-7 mr-2 text-[var(--color-neon-purple)] animate-pulse" />
                Remix Tree ({remixes.length})
              </h3>
              <p className="text-zinc-500 mt-1">Discover custom prompt remixes crafted by the community.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {remixes.map((remix) => (
                <div key={remix.id} className="bg-white border border-zinc-200/60 rounded-3xl p-3 hover:shadow-xl hover:border-zinc-300 transition-all group flex flex-col h-full relative overflow-hidden">
                  {/* Thumbnail */}
                  <Link href={`/prompt/${remix.id}`} className="aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 relative block mb-3 border border-zinc-100">
                    <img 
                      src={getOptimizedImageUrl(remix.image_url, 'card')} 
                      alt={remix.title} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-bold text-white bg-black/60 px-3 py-1.5 rounded-full tracking-wider">View Variation</span>
                    </div>
                  </Link>

                  {/* Creator */}
                  <div className="flex items-center space-x-2 px-1 mb-2">
                    <Avatar 
                      src={remix.profiles?.avatar_url} 
                      username={remix.profiles?.username || 'U'} 
                      size="xs" 
                      className="border border-zinc-200"
                    />
                    <span className="text-xs font-bold text-zinc-800 truncate flex items-center gap-0.5">
                      @{remix.profiles?.username}
                      {remix.profiles?.badges?.includes('verified') && (
                        <span title="Verified Creator"><BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 shrink-0" /></span>
                      )}
                    </span>
                  </div>

                  <Link href={`/prompt/${remix.id}`} className="block px-1 flex-1">
                    <h4 className="font-extrabold text-zinc-950 text-sm leading-snug group-hover:text-[var(--color-neon-purple)] transition-colors line-clamp-1">{remix.title}</h4>
                    {remix.remix_notes && (
                      <p className="text-zinc-500 text-xs mt-1 italic line-clamp-2">"{remix.remix_notes}"</p>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Related Prompts Feed */}
        <div className="mt-16 pt-12 border-t border-zinc-200/60">
          <div className="mb-8">
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-[var(--color-neon-purple)] animate-pulse" />
              More Like This
            </h3>
            <p className="text-zinc-500 mt-1">Personalized recommendations based on tags, creators, and visual styles.</p>
          </div>
          
          <RelatedPromptsFeed 
            promptId={prompt.id}
            category={prompt.category}
            tool={prompt.ai_tool}
            aspectRatio={prompt.aspect_ratio}
            tags={prompt.tags}
            creatorUsername={prompt.profiles?.username || ''}
          />
        </div>

      </div>
    </div>
  );
}
