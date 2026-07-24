'use client';

import React, { useEffect, useState } from 'react';
import { StudioProvider, useStudioState } from '@/components/ui/studio/context';
import { StudioSubNav } from '@/components/ui/studio/StudioSubNav';
import { StudioUploader } from '@/components/ui/studio/StudioUploader';
import { StudioLoading } from '@/components/ui/studio/StudioLoading';
import { StudioEditor } from '@/components/ui/studio/StudioEditor';

function StudioContent() {
  const state = useStudioState();

  if (state.step === 'upload') {
    return <StudioUploader />;
  }

  if (state.step === 'analyzing') {
    return <StudioLoading />;
  }

  return <StudioEditor />;
}

export default function StudioSuitePage() {
  const [initialCredits, setInitialCredits] = useState(10);

  useEffect(() => {
    async function loadCredits() {
      try {
        const { getCreditBalanceAction } = await import('@/app/actions/studio');
        const res = await getCreditBalanceAction();
        if (res.success && typeof res.balance === 'number') {
          setInitialCredits(res.balance);
        }
      } catch (err) {
        console.warn('Failed to load user credits:', err);
      }
    }
    loadCredits();
  }, []);

  return (
    <StudioProvider initialCredits={initialCredits}>
      <div className="min-h-screen bg-zinc-950 text-white selection:bg-purple-600 selection:text-white pb-20">
        <StudioSubNav creditBalance={initialCredits} />
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <StudioContent />
        </main>
      </div>
    </StudioProvider>
  );
}
