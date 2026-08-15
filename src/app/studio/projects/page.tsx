import React from 'react';
import { redirect } from 'next/navigation';
import { verifyAiStudioAccessServer } from '@/lib/ai-studio/guard';
import { StudioProjectsClient } from '@/components/ui/studio/StudioProjectsClient';
import { StudioComingSoon } from '@/components/ui/studio/StudioComingSoon';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function StudioProjectsPage() {
  const access = await verifyAiStudioAccessServer();

  if (!access.allowed) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return <StudioComingSoon accessResult={access} userEmail={user?.email || null} />;
  }

  return <StudioProjectsClient />;
}
