'use client';

import { useEffect } from 'react';

/**
 * ConsentRestorer — restores GA4 Consent Mode v2 on hydration.
 *
 * The consent default (in layout.tsx) sets all 4 signals to 'denied'.
 * If the user previously granted consent (stored in localStorage), this
 * component fires a consent 'update' with all 4 signals set to 'granted'
 * once the client hydrates — BEFORE any GA events fire.
 *
 * IMPORTANT: Must update ALL 4 signals that were set in the default,
 * otherwise partial consent state causes ad signals to remain 'denied'
 * even when the user said yes.
 */
export default function ConsentRestorer() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('prizom-cookie-consent');

    if (stored === 'granted' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    }
  }, []);

  return null;
}
