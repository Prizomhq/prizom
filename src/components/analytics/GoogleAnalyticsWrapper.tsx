'use client';

import { GoogleAnalytics } from '@next/third-parties/google';

interface GoogleAnalyticsWrapperProps {
  gaId: string;
}

export default function GoogleAnalyticsWrapper({ gaId }: GoogleAnalyticsWrapperProps) {
  // GA loads unconditionally. Consent Mode v2 (in layout.tsx) controls
  // whether data collection is active or restricted.
  // When consent is 'denied', GA sends cookieless pings only.
  // When consent is 'granted', GA sends full tracking data.
  if (!gaId || gaId === 'G-XXXXXX') return null;

  return <GoogleAnalytics gaId={gaId} />;
}
