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
    return <StudioComingSoon accessResult={access} />;
  }

  return <>{children}</>;
}
