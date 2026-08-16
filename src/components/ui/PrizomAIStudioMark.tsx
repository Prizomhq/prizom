'use client';

import React from 'react';
import PrizomLogo from '@/components/ui/PrizomLogo';

interface PrizomAIStudioMarkProps {
  className?: string;
  size?: number;
  variant?: 'gradient' | 'solid' | 'monochrome';
}

/**
 * Prizom AI Studio Feature Mark
 * Original geometric optics mark: Precision prism hexagon + light refraction beam + prompt vector node.
 * Concept: Image -> Optical Prism Refraction -> Prompt Syntax.
 * Optimized for light & dark surfaces at 16px, 20px, 24px, 32px, 48px, 64px.
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
        {/* Core Prizom Electric Gradient */}
        <linearGradient id={`${gradientId}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        {/* Optical Accent Gradient */}
        <linearGradient id={`${gradientId}-accent`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        {/* Refraction Beam Glow */}
        <linearGradient id={`${gradientId}-beam`} x1="12" y1="24" x2="36" y2="24">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* 1. Outer Precision Hexagonal Prism Frame */}
      <path
        d="M24 3L42 13.3923V34.6077L24 45L6 34.6077V13.3923L24 3Z"
        stroke={variant === 'gradient' ? `url(#${gradientId}-bg)` : 'currentColor'}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill={variant === 'solid' ? 'currentColor' : 'none'}
        className="opacity-90"
      />

      {/* 2. Internal Refracting Prism Triangle (Image Light -> Spectrum) */}
      <path
        d="M24 11L34 29H14L24 11Z"
        stroke={variant === 'gradient' ? `url(#${gradientId}-bg)` : 'currentColor'}
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
        opacity="0.85"
      />

      {/* 3. Optical Refraction Beam (Deconstructing Image into Syntax) */}
      <path
        d="M14 29L24 23L34 29"
        stroke={variant === 'gradient' ? `url(#${gradientId}-beam)` : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* 4. Signature P-Prism Core Node */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21 18H26C28.2091 18 30 19.7909 30 22C30 24.2091 28.2091 26 26 26H23V30H21V18ZM23 20V24H26C27.1046 24 28 23.1046 28 22C28 20.8954 27.1046 20 26 20H23Z"
        fill={variant === 'gradient' ? `url(#${gradientId}-bg)` : 'currentColor'}
      />

      {/* 5. Focal Optical Ray Point */}
      <circle
        cx="34"
        cy="13.5"
        r="2.5"
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
  const logoSize = size === 'sm' ? 24 : size === 'lg' ? 36 : 28;
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 26 : 22;
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-base';
  const badgeSize = size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Official Prizom Brand Logo */}
      <PrizomLogo size={logoSize} />
      <div className="flex items-center gap-2">
        <span className={`font-extrabold tracking-tight text-slate-900 ${textSize}`}>
          Prizom
        </span>
        {showBadge && (
          <span className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-md ${badgeSize}`}>
            <PrizomAIStudioMark size={iconSize} />
            <span>AI Studio</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function PrizomAIStudioCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <PrizomLogo size={18} />
      <span className="text-xs font-bold text-slate-900 tracking-tight">AI Studio</span>
    </div>
  );
}

export default PrizomAIStudioMark;

