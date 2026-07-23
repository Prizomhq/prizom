'use client';

import React from 'react';
import { StudioProvider, useStudioState } from '@/components/ui/studio/context';
import { StudioUploader } from '@/components/ui/studio/StudioUploader';
import { StudioLoading } from '@/components/ui/studio/StudioLoading';
import { StudioEditor } from '@/components/ui/studio/StudioEditor';

function StudioContent() {
  const state = useStudioState();

  if (state.step === 'upload') {
    return <StudioUploader />;
  }

  if (state.step === 'analyzing') {
    return (
      <>
        <StudioLoading />
        {/* Render editor beneath when initial response stream arrives */}
        {state.aiResponse && <StudioEditor />}
      </>
    );
  }

  return <StudioEditor />;
}

export default function StudioPage() {
  const [initialCredits, setInitialCredits] = React.useState(10);

  React.useEffect(() => {
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
      <div className="min-h-screen pt-20 pb-16 bg-[#fcfcfc]">
        <StudioContent />
      </div>
    </StudioProvider>
  );
}
