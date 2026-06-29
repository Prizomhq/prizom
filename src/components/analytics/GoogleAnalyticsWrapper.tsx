'use client';

import { useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';

interface GoogleAnalyticsWrapperProps {
  gaId: string;
}

export default function GoogleAnalyticsWrapper({ gaId }: GoogleAnalyticsWrapperProps) {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkConsent = () => {
      const consent = localStorage.getItem('prizom-cookie-consent');
      setHasConsent(consent === 'granted');
    };

    // Initial check on mount
    checkConsent();

    // Listen for cookie consent updates
    window.addEventListener('cookie-consent-updated', checkConsent);
    return () => {
      window.removeEventListener('cookie-consent-updated', checkConsent);
    };
  }, []);

  if (!hasConsent) return null;

  return <GoogleAnalytics gaId={gaId} />;
}
