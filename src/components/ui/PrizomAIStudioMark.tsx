'use client';

import React from 'react';

interface PrizomAIStudioMarkProps {
  className?: string;
  size?: number;
  variant?: 'solid' | 'gradient' | 'monochrome';
}

/**
 * Prizom AI Studio Official Brand Mark
 * Precise geometric optics icon: Hexagonal precision aperture + nested geometric P-prism lens.
 */
export function PrizomAIStudioMark({
  className = '',
  size = 24,
  variant = 'gradient'
}: PrizomAIStudioMarkProps) {
  const gradientId = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 align-middle ${className}`}
    >
      <defs>
        <linearGradient id={`${gradientId}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id={`${gradientId}-accent`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Outer Precision Hexagonal Aperture Frame */}
      <path
        d="M24 4L41.3205 14V34L24 44L6.67949 34V14L24 4Z"
        stroke={variant === 'gradient' ? `url(#${gradientId}-bg)` : 'currentColor'}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill={variant === 'solid' ? 'currentColor' : 'none'}
        className="opacity-90"
      />

      {/* Internal Geometric Optics Lens Prism ('P' Integration) */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 14H28C32.4183 14 36 17.5817 36 22C36 26.4183 32.4183 30 28 30H22V34H16V14ZM22 20V24H27.5C28.8807 24 30 22.8807 30 21.5C30 20.1193 28.8807 19.5 27.5 19.5H22V20Z"
        fill={variant === 'gradient' ? `url(#${gradientId}-bg)` : 'currentColor'}
      />

      {/* Focal Ray Accent Indicator */}
      <circle
        cx="34"
        cy="14"
        r="3"
        fill={variant === 'gradient' ? `url(#${gradientId}-accent)` : 'currentColor'}
      />
    </svg>
  );
}

interface PrizomAIStudioLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export function PrizomAIStudioLogo({
  className = '',
  size = 'md',
  showBadge = true
}: PrizomAIStudioLogoProps) {
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 32 : 24;
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-base';
  const badgeSize = size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <PrizomAIStudioMark size={iconSize} />
      <div className="flex items-center gap-2">
        <span className={`font-extrabold tracking-tight text-white ${textSize}`}>
          Prizom
        </span>
        {showBadge && (
          <span className={`font-mono font-bold uppercase tracking-widest bg-purple-950/80 text-purple-300 border border-purple-800/50 rounded-md ${badgeSize}`}>
            AI Studio
          </span>
        )}
      </div>
    </div>
  );
}

export function PrizomAIStudioCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <PrizomAIStudioMark size={16} />
      <span className="text-xs font-bold text-white tracking-tight">AI Studio</span>
    </div>
  );
}

export default PrizomAIStudioMark;
