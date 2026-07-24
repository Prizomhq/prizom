import React from 'react';
import { verifyAiStudioAccessServer } from '@/lib/ai-studio/guard';
import { StudioComingSoon } from '@/components/ui/studio/StudioComingSoon';

export const dynamic = 'force-dynamic';

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await verifyAiStudioAccessServer();

  if (!access.allowed) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white selection:bg-purple-600 selection:text-white flex items-center justify-center">
        <StudioComingSoon />
      </div>
    );
  }

  return <>{children}</>;
}
