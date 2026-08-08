import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyAiStudioAccessServer } from '@/lib/ai-studio/guard';
import { createClient } from '@/lib/supabase/server';
import { getUserCreditBalance } from '@/lib/ai-studio/credits';
import { StudioClientWrapper } from '@/components/ui/studio/StudioClientWrapper';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudioSuitePage() {
  const access = await verifyAiStudioAccessServer();

  // Enforce Server-Side Super Admin authorization gate
  if (!access.allowed) {
    if (access.reason === 'unauthenticated') {
      redirect('/login?next=/studio');
    }

    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Super Admin Access Only
            </h1>
            <p className="text-sm text-zinc-400 font-medium leading-relaxed">
              Prizom AI Studio V3 is currently in private experimental testing. Access is strictly restricted to Super Admin accounts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>Authorization Status: {access.reason || 'restricted'}</span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Prizom Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Fetch authoritative user credit balance from database
  let initialCredits = 10;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      initialCredits = await getUserCreditBalance(user.id, supabase);
    }
  } catch (err) {
    console.warn('[STUDIO PAGE] Failed to fetch server credit balance:', err);
  }

  return <StudioClientWrapper initialCredits={initialCredits} />;
}
