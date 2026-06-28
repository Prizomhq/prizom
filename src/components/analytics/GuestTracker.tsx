'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackGuestEvent } from '@/app/actions/guestActions';
import { createClient } from '@/lib/supabase/client';

export default function GuestTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedKey = useRef<string>('');
  const [consentUpdated, setConsentUpdated] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleConsentUpdate = () => {
      setConsentUpdated(prev => prev + 1);
    };

    window.addEventListener('cookie-consent-updated', handleConsentUpdate);
    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate);
    };
  }, []);

  useEffect(() => {
    const checkAndTrack = async () => {
      // 1. Enforce cookie consent check (PECR / GDPR compliance)
      if (typeof window !== 'undefined') {
        const consent = localStorage.getItem('prizom-cookie-consent');
        if (consent !== 'granted') {
          return;
        }
      }

      // Exclude admin/api pages from guest event tracking
      if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
        return;
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const query = searchParams.get('search') || searchParams.get('q') || '';
        const currentKey = `${pathname}?q=${query}`;

        // Prevent double tracking in React StrictMode
        if (lastTrackedKey.current === currentKey) {
          return;
        }
        lastTrackedKey.current = currentKey;

        // Track page view for guest
        await trackGuestEvent('page_view', { pagePath: pathname });
        
        // Track search event if search query exists
        if (query) {
          await trackGuestEvent('search', { searchQuery: query, pagePath: pathname });
        }
      }
    };

    checkAndTrack();
  }, [pathname, searchParams, consentUpdated]);

  return null;
}
