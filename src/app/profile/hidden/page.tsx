import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Eye, Trash2, EyeOff, Sparkles, Inbox } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Avatar from '@/components/ui/Avatar';
import HiddenPromptGrid from './HiddenPromptGrid';

export default async function HiddenPromptsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Fetch the user's details for header
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  let hiddenPrompts: any[] = [];

  // 2. Query the user's hidden prompts directly from the new table
  const { data: saved } = await supabase
    .from('user_hidden_prompts')
    .select('prompt_id, prompts(*, profiles!user_id(username, full_name, avatar_url))')
    .eq('user_id', user.id);

  if (saved) {
    hiddenPrompts = saved
      .filter((s: any) => s.prompts !== null)
      .map((s: any) => s.prompts);
  }

  return (
    <div className="min-h-screen pb-6 md:pb-24 pt-8 bg-[#fcfcfc] relative">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-gradient-to-b from-[var(--color-electric-blue)]/5 via-[var(--color-neon-purple)]/5 to-transparent blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Navigation */}
        <Link href="/profile" className="inline-flex items-center text-zinc-500 hover:text-zinc-900 font-bold transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-200/60 pb-8 mb-10">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              <EyeOff className="w-8 h-8 text-[var(--color-neon-purple)] animate-pulse" />
              Hidden Prompts
            </h1>
            <p className="text-zinc-500 text-sm font-semibold mt-1">
              Manage your hidden content. Prompts you hide will be completely filtered from feeds and search results.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Avatar 
              src={profile?.avatar_url} 
              username={profile?.username || 'U'} 
              size="sm" 
              className="border border-zinc-200" 
            />
            <div className="text-left">
              <span className="block text-xs font-black text-zinc-900 leading-tight">@{profile?.username}</span>
              <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Personal Vault</span>
            </div>
          </div>
        </div>

        {/* Dynamic Grid Client wrapper */}
        {hiddenPrompts.length === 0 ? (
          <div className="py-24 px-6 text-center bg-white border border-zinc-200/50 rounded-[2.5rem] shadow-sm max-w-2xl mx-auto flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-zinc-50 border border-zinc-150 rounded-[1.5rem] flex items-center justify-center mb-6 text-zinc-300">
              <Inbox className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-zinc-900 mb-2">Vault is Empty</h3>
            <p className="text-zinc-500 font-semibold text-sm max-w-xs mb-8 leading-relaxed">
              You haven&apos;t hidden any prompt templates yet. Prompts you hide from prompt cards will display here.
            </p>
            <Link 
              href="/discover" 
              className="px-6 py-3.5 bg-gradient-to-r from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] hover:shadow-lg text-white font-bold rounded-full text-xs uppercase tracking-wider hover:-translate-y-0.5 transition-all"
            >
              Discover Prompts
            </Link>
          </div>
        ) : (
          <HiddenPromptGrid initialPrompts={hiddenPrompts} />
        )}

      </div>
    </div>
  );
}
