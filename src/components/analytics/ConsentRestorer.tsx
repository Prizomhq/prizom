'use client';

import { useEffect } from 'react';

export default function ConsentRestorer() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('prizom-cookie-consent');

    if (stored === 'granted' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
  }, []);

  return null;
}
