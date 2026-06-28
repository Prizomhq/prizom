import Link from 'next/link';
import { ArrowLeft, Bookmark, Lock } from 'lucide-react';
import MasonryGrid from '@/components/ui/MasonryGrid';
import PromptCard from '@/components/ui/PromptCard';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import CollectionHeaderClient from './CollectionHeaderClient';

import { getEffectiveHiddenPromptIds } from '@/app/actions/hiddenActions';

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the collection and its prompts
  const { data: collection, error } = await supabase
    .from('collections')
    .select(`
      *,
      saved_prompts (
        prompt_id,
        prompts (
          *,
          profiles!user_id ( username, full_name, avatar_url, role, badges )
        )
      )
    `)
    .eq('id', resolvedParams.id)
    .single();

  if (error || !collection) {
    return notFound();
  }

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

  // Fetch collection creator profile to check if they are suspended/banned/disabled
  const { data: collectionOwner } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', collection.user_id)
    .single();

  const isOwnerSuspendedOrBanned = ['suspended', 'banned', 'permanently_banned', 'disabled'].includes(collectionOwner?.role || '');
  if (isOwnerSuspendedOrBanned && !isCurrentUserAdmin) {
    return notFound();
  }

  // Extract the actual prompts from the join table, excluding hidden prompts
  const hiddenIds = await getEffectiveHiddenPromptIds();
  const prompts = collection.saved_prompts
    .map((sp: any) => sp.prompts)
    .filter((p: any) => p !== null && !hiddenIds.includes(p.id))
    .filter((p: any) => isCurrentUserAdmin || !['suspended', 'banned', 'permanently_banned', 'disabled'].includes(p.profiles?.role || 'user'));

  return (
    <div className="min-h-screen pb-6 md:pb-20 pt-8 bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <Link href="/profile" className="inline-flex items-center text-zinc-500 hover:text-zinc-900 font-medium transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Link>
 
        {user && user.id === collection.user_id ? (
          <CollectionHeaderClient
            collectionId={collection.id}
            initialIsPrivate={collection.is_private || false}
            collectionName={collection.name}
            promptCount={prompts.length}
          />
        ) : (
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-zinc-200 pb-8 gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Bookmark className="w-5 h-5 text-[var(--color-electric-blue)]" />
                </div>
                <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">{collection.name}</h1>
                {collection.is_private && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-650 border border-zinc-200">
                    <Lock className="w-3 h-3" />
                    Private
                  </span>
                )}
              </div>
              <p className="text-zinc-500 font-medium ml-0 md:ml-13">
                {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'}
              </p>
            </div>
          </div>
        )}

        {prompts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-zinc-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] blur-[100px] opacity-[0.05] pointer-events-none"></div>
            <h3 className="text-2xl font-black mb-2 text-zinc-900 tracking-tight">This collection is empty</h3>
            <p className="text-zinc-500 mb-8 max-w-sm mx-auto font-medium">Browse the discover page to find prompts to save here.</p>
            <Link href="/discover" className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-lg transition-all inline-block hover:-translate-y-0.5">
              Discover Prompts
            </Link>
          </div>
        ) : (
          <MasonryGrid>
            {prompts.map((prompt: any) => (
              <PromptCard 
                key={prompt.id} 
                id={prompt.id}
                title={prompt.title}
                imageUrl={prompt.image_url}
                tool={prompt.ai_tool}
                creator={{ 
                  username: prompt.profiles?.username || 'unknown',
                  displayName: prompt.profiles?.full_name,
                  avatarUrl: prompt.profiles?.avatar_url,
                  badges: prompt.profiles?.badges
                }}
                likes={prompt.likes_count}
                saves={prompt.saves_count}
                description={prompt.description}
                tags={prompt.tags}
                remixOf={prompt.remix_of}
                remixCount={prompt.remix_count}
                category={prompt.category}
              />
            ))}
          </MasonryGrid>
        )}
      </div>
    </div>
  );
}
