'use client';

import { useEffect } from 'react';

interface PromptViewTrackerProps {
  id: string;
  title: string;
  category?: string;
  tool?: string;
}

export default function PromptViewTracker({ id, title, category, tool }: PromptViewTrackerProps) {
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'view_item', {
        items: [{
          item_id: id,
          item_name: title,
          item_category: category || 'prompt',
          item_brand: tool || 'unknown'
        }]
      });
    }
  }, [id, title, category, tool]);

  return null;
}
