'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the first render — the initial page_view is already
    // fired by gtag('config', ...) when GA loads.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Build the full URL path
    const searchString = searchParams?.toString();
    const url = pathname + (searchString ? `?${searchString}` : '');

    // Send page_view event to GA4
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: url,
        page_title: document.title,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
