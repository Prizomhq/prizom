'use client';

import dynamic from 'next/dynamic';

const ConsentGuard = dynamic(() => import("@/components/shared/ConsentGuard"), { ssr: false });
const OnboardingWizard = dynamic(() => import("@/components/shared/OnboardingWizard"), { ssr: false });
const CookieBanner = dynamic(() => import("@/components/shared/CookieBanner"), { ssr: false });

export default function ClientWidgets() {
  return (
    <>
      <ConsentGuard />
      <OnboardingWizard />
      <CookieBanner />
    </>
  );
}
