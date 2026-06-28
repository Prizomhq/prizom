import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EditPromptForm from './EditPromptForm';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPromptPage({ params }: PageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/prompt/${resolvedParams.id}/edit`);
  }

  // Fetch the prompt details
  const { data: prompt, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', resolvedParams.id)
    .maybeSingle();

  if (error || !prompt) {
    notFound();
  }

  // Strict ownership enforcement
  const isOwner = prompt.user_id === user.id;

  if (!isOwner) {
    return (
      <div className="min-h-screen pb-6 md:pb-20 pt-8 bg-[#0a0a0c] flex items-center justify-center relative overflow-hidden text-zinc-100 animate-in fade-in duration-300">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-red-500/10 to-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-[#121215]/85 rounded-[2.5rem] border border-zinc-800/80 shadow-2xl backdrop-blur-2xl max-w-lg w-full relative z-10 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-10 h-10 animate-pulse" />
          </div>
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
            403 Forbidden
          </span>
          <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-wide">Access Restricted</h3>
          <p className="text-zinc-400 font-semibold text-sm leading-relaxed mb-8 max-w-sm">
            You do not have permission to edit this prompt. Only the absolute creator is permitted to modify its contents.
          </p>
          <Link href={`/prompt/${resolvedParams.id}`} className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-[0_8px_25px_rgba(239,68,68,0.25)] text-white rounded-full text-xs font-black uppercase tracking-wider hover:-translate-y-0.5 transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back to Prompt Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] py-12 px-4 sm:px-6 lg:px-8">
      <EditPromptForm prompt={prompt} />
    </div>
  );
}
