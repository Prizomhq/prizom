'use client';

import React from 'react';
import Link from 'next/link';
import { PrizomAIStudioMark } from './PrizomAIStudioMark';

interface AIStudioAttributionProps {
  className?: string;
  variant?: 'card' | 'detail' | 'compact';
  showLink?: boolean;
}

/**
 * AIStudioAttribution Component
 * Official non-spoofable product attribution badge for AI Studio-generated prompts.
 * Appears on published cards, prompt detail pages, and share flows.
 */
export function AIStudioAttribution({
  className = '',
  variant = 'card',
  showLink = true
}: AIStudioAttributionProps) {
  const content = (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 px-2.5 py-1 text-purple-300 backdrop-blur-md transition-all hover:bg-purple-900/60 hover:border-purple-400/60 hover:shadow-[0_0_12px_rgba(168,85,247,0.25)] ${
        variant === 'compact' ? 'text-[10px] px-2 py-0.5' : 'text-xs font-medium'
      } ${className}`}
    >
      <PrizomAIStudioMark size={variant === 'compact' ? 12 : 14} variant="gradient" />
      <span className="font-sans font-semibold tracking-tight text-zinc-200">
        Made with <strong className="font-extrabold text-purple-300">Prizom AI Studio</strong>
      </span>
    </div>
  );

  if (showLink) {
    return (
      <Link
        href="/studio"
        title="Created using Prizom AI Studio Image-to-Prompt Engine"
        onClick={(e) => e.stopPropagation()}
        className="inline-block"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default AIStudioAttribution;
