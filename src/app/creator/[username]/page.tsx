import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Link as LinkIcon, Calendar, Image as ImageIcon, Bookmark, Repeat, ShieldAlert, BadgeCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import MasonryGrid from '@/components/ui/MasonryGrid';
import PromptCard from '@/components/ui/PromptCard';
import { checkIsFollowing } from '@/app/actions/follows';
import CreatorTabs from './CreatorTabs';
import Avatar from '@/components/ui/Avatar';
import CreatorStats from '@/components/ui/CreatorStats';
import { checkBlockStatus } from '@/app/actions/moderation';
import { getUserAchievements, triggerAchievementCheck } from '@/app/actions/achievements';
import CreatorProfileActions from '@/components/ui/CreatorProfileActions';
import { getPublicCMS } from '@/app/actions/adminActions';
import { getEffectiveHiddenPromptIds } from '@/app/actions/hiddenActions';
import { Metadata } from 'next';

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const username = resolvedParams.username;
  const supabase = await createClient();

  const { data: creator } = await supabase
    .from('profiles')
    .select('full_name, username, bio, avatar_url')
    .eq('username', username)
    .maybeSingle();

  if (!creator) {
    return {
      title: 'Creator Profile Not Found | Prizom',
    };
  }

  const displayName = creator.full_name || creator.username;
  const title = `${displayName} (@${creator.username}) | Prizom`;
  const description = creator.bio || `View prompt collections and remixes from creator ${displayName} on Prizom, the collaborative AI prompt registry.`;
  
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.prizom.in';
  if (siteUrl.includes('://prizom.in')) {
    siteUrl = siteUrl.replace('://prizom.in', '://www.prizom.in');
  }
  const canonicalUrl = `${siteUrl}/creator/${creator.username}`;
  const ogImage = creator.avatar_url || `${siteUrl}/default-avatar.png`;

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
          width: 250,
          height: 250,
          alt: displayName,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CreatorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const username = resolvedParams.username;
  const supabase = await createClient();

  // Get current user auth
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isLoggedIn = !!currentUser;

  // Fetch creator profile
  const { data: creator, error: creatorError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (creatorError || !creator) {
    return notFound();
  }

  // Fetch current viewer role to restrict access
  let isCurrentUserAdmin = false;
  if (currentUser) {
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();
    isCurrentUserAdmin = ['super_admin', 'admin', 'moderator'].includes(currentUserProfile?.role || '');
  }

  const isCreatorSuspendedOrBanned = ['suspended', 'banned', 'permanently_banned', 'disabled'].includes(creator.role || '');
  if (isCreatorSuspendedOrBanned && !isCurrentUserAdmin) {
    return notFound();
  }

  // Check block status (bidirectional)
  const { isBlockedByMe, hasBlockedMe, anyBlock } = await checkBlockStatus(creator.id);
  const isOwnProfile = currentUser?.id === creator.id;

  // Check if current user is following
  const isFollowing = currentUser ? await checkIsFollowing(creator.id) : false;

  const { hiddenPrompts: adminHiddenPrompts } = await getPublicCMS();
  const userHiddenIds = await getEffectiveHiddenPromptIds();
  
  const allHidden = Array.from(new Set([
    ...(adminHiddenPrompts || []),
    ...userHiddenIds
  ]));

  // Fetch creator's prompts (excluding remixes)
  let promptsQuery = supabase
    .from('prompts')
    .select('*, profiles!user_id(username, full_name, avatar_url, role, badges), remix_of, remix_count')
    .eq('user_id', creator.id)
    .is('remix_of', null)
    .eq('moderation_status', 'active')
    .order('created_at', { ascending: false });

  if (allHidden.length > 0) {
    promptsQuery = promptsQuery.not('id', 'in', `(${allHidden.join(',')})`);
  }
  const { data: prompts } = await promptsQuery;

  // Fetch creator's remixes
  let remixesQuery = supabase
    .from('prompts')
    .select('*, profiles!user_id(username, full_name, avatar_url, role, badges), remix_of, remix_count')
    .eq('user_id', creator.id)
    .not('remix_of', 'is', null)
    .eq('moderation_status', 'active')
    .order('created_at', { ascending: false });

  if (allHidden.length > 0) {
    remixesQuery = remixesQuery.not('id', 'in', `(${allHidden.join(',')})`);
  }
  const { data: remixes } = await remixesQuery;

  // Fetch creator's collections (excluding the private "Hidden Prompts" collection)
  const { data: collections } = await supabase
    .from('collections')
    .select(`
      *,
      saved_prompts (
        prompt_id,
        prompts ( image_url )
      )
    `)
    .eq('user_id', creator.id)
    .neq('name', 'Hidden Prompts')
    .order('created_at', { ascending: false });

  // Fetch creator's removed prompts (moderated) if isOwnProfile is true
  let removedPrompts: any[] = [];
  if (isOwnProfile) {
    const { data: removed } = await supabase
      .from('prompts')
      .select('*, prompt_appeals(*), profiles!user_id(username, full_name, avatar_url, role, badges), remix_of, remix_count')
      .eq('user_id', creator.id)
      .eq('moderation_status', 'pending_deletion')
      .order('created_at', { ascending: false });
    removedPrompts = removed || [];
  }

  // If viewing own profile, run self achievement checks to qualify/unlock badges under their own RLS session
  if (isOwnProfile) {
    try {
      await Promise.all([
        triggerAchievementCheck(creator.id, 'upload'),
        triggerAchievementCheck(creator.id, 'remix'),
        triggerAchievementCheck(creator.id, 'like'),
        triggerAchievementCheck(creator.id, 'save'),
        triggerAchievementCheck(creator.id, 'trending')
      ]);
    } catch (e) {
      console.error('Failed to run self achievement checks on profile load:', e);
    }
  }

  // Fetch achievements
  const achievements = await getUserAchievements(creator.id);

  return (
    <div className="min-h-screen pb-6 md:pb-24 bg-[#fcfcfc] relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://www.prizom.in"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Creators",
                  "item": "https://www.prizom.in/discover"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": creator.full_name || creator.username,
                  "item": `https://www.prizom.in/creator/${creator.username}`
                }
              ]
            },
            {
              "@context": "https://schema.org",
              "@type": "Person",
              "name": creator.full_name || creator.username,
              "username": creator.username,
              "description": creator.bio || `View prompt collections and remixes from creator ${creator.full_name || creator.username} on Prizom.`,
              "image": creator.avatar_url || "https://www.prizom.in/default-avatar.png",
              "url": `https://www.prizom.in/creator/${creator.username}`
            }
          ])
        }}
      />
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[var(--color-electric-blue)]/5 via-[var(--color-neon-purple)]/5 to-transparent blur-[120px] pointer-events-none -z-10"></div>

      {/* Warning Banner if removed prompts exist */}
      {isOwnProfile && removedPrompts.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 text-red-900/90 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-extrabold text-sm uppercase tracking-wider">Action Required: Content Removed</h4>
              <p className="text-xs font-semibold text-zinc-500 mt-1 leading-relaxed">
                One or more of your prompt templates have been removed by the moderation team. You have a 15-day grace period to appeal the removal. Access the <strong className="text-zinc-800">Removed Content</strong> tab below to submit appeals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Profile Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-10 text-center md:text-left">
          
          {/* Avatar */}
          <Avatar 
            src={creator.avatar_url} 
            username={creator.username} 
            size="xl" 
            className="mb-6 md:mb-0 shadow-2xl shadow-purple-500/20 border-4 border-white" 
          />

          {/* Info */}
          <div className="flex-1 max-w-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <div>
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center justify-center md:justify-start gap-1.5">
                  {creator.full_name || creator.username}
                  {creator.badges?.includes('verified') && (
                    <span title="Verified Creator"><BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500/10 shrink-0" /></span>
                  )}
                </h1>
                <p className="text-lg text-zinc-500 font-bold">@{creator.username}</p>
              </div>
              
              <div className="flex justify-center md:justify-end">
                <CreatorProfileActions 
                  creatorId={creator.id}
                  creatorName={creator.username}
                  isLoggedIn={isLoggedIn}
                  isOwnProfile={isOwnProfile}
                  initialIsFollowing={isFollowing}
                />
              </div>
            </div>

            {anyBlock ? (
              <div className="bg-red-50/50 border border-red-100 rounded-3xl p-6 flex items-center space-x-4 my-6 text-red-900/80">
                <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">Account Blocked</h4>
                  <p className="text-xs font-semibold text-zinc-500 mt-0.5">
                    {isBlockedByMe 
                      ? 'You have blocked this creator. You can unblock them in your profile settings.' 
                      : 'This creator account is currently unavailable.'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Stats Row */}
                <CreatorStats 
                  userId={creator.id}
                  creatorName={creator.full_name || creator.username}
                  postCount={(prompts?.length || 0) + (remixes?.length || 0)}
                  followerCount={creator.follower_count || 0}
                  followingCount={creator.following_count || 0}
                  isLoggedIn={isLoggedIn}
                  currentUserId={currentUser?.id || null}
                />

                {/* Bio */}
                {creator.bio && (
                  <p className="text-zinc-700 font-medium leading-relaxed mb-4 whitespace-pre-wrap">
                    {creator.bio}
                  </p>
                )}

                {/* Achievements Badges Row */}
                {achievements && achievements.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                    {achievements.map((ach) => (
                      <div 
                        key={ach.id} 
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-indigo-50/70 border border-indigo-100/30 text-indigo-950 font-bold text-xs shadow-sm cursor-help hover:bg-indigo-100 transition-colors"
                        title={ach.description}
                      >
                        <span className="text-sm">{ach.badgeIcon}</span>
                        <span>{ach.title}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Links / Info */}
                <div className="flex items-center justify-center md:justify-start space-x-6 text-sm text-zinc-500 font-medium">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    Joined {new Date(creator.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs & Content (Only show if not blocked) */}
      {!anyBlock && (
        <CreatorTabs 
          prompts={prompts || []} 
          remixes={remixes || []} 
          collections={collections || []} 
          removedPrompts={removedPrompts}
          isOwnProfile={isOwnProfile}
        />
      )}

    </div>
  );
}
