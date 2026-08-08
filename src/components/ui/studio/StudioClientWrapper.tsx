'use client';

import React from 'react';
import { StudioProvider, useStudioState } from './context';
import { StudioUploader } from './StudioUploader';
import { StudioLoading } from './StudioLoading';
import { StudioEditor } from './StudioEditor';

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

export function StudioClientWrapper({ initialCredits }: { initialCredits: number }) {
  return (
    <StudioProvider initialCredits={initialCredits}>
      <div className="min-h-screen bg-zinc-950 text-white selection:bg-purple-600 selection:text-white pb-20">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <StudioContent />
        </main>
      </div>
    </StudioProvider>
  );
}
