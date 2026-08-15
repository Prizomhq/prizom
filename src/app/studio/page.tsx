import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyAiStudioAccessServer } from '@/lib/ai-studio/guard';
import { createClient } from '@/lib/supabase/server';
import { getUserCreditBalance } from '@/lib/ai-studio/credits';
import { StudioClientWrapper } from '@/components/ui/studio/StudioClientWrapper';
import { StudioComingSoon } from '@/components/ui/studio/StudioComingSoon';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudioSuitePage() {
  const access = await verifyAiStudioAccessServer();

  // Enforce Server-Side Early Access authorization gate
  if (!access.allowed) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return <StudioComingSoon accessResult={access} userEmail={user?.email || null} />;
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
