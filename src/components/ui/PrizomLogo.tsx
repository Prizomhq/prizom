'use client';

interface PrizomLogoProps {
  className?: string;
  size?: number;
}

export default function PrizomLogo({ className = '', size = 32 }: PrizomLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Prizom Logo"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain' }}
    />
  );
}

interface PrizomWordmarkProps {
  className?: string;
  height?: number;
}

export function PrizomWordmark({ className = '', height = 32 }: PrizomWordmarkProps) {
  // SVG Width-to-Height ratio: ~3.625 (290 / 80)
  const width = Math.round(height * 3.625);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 290 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 
        Stylized geometric vector wordmark for "PRIZOM"
        Each letter drawn as geometric filled paths for consistent font-less rendering.
      */}

      {/* Letter 'P' */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 15,15 H 23 V 65 H 15 V 15 Z M 23,15 H 44 C 52,15 57,20 57,28 C 57,36 52,40 44,40 H 23 V 15 Z M 23,23 V 33 H 42 C 45,33 48,31 48,28 C 48,25 45,23 42,23 H 23 Z"
        fill="currentColor"
      />

      {/* Letter 'R' */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 65,15 H 73 V 65 H 65 V 15 Z M 73,15 H 94 C 102,15 107,20 107,28 C 107,36 102,40 94,40 H 73 V 15 Z M 73,23 V 33 H 92 C 95,33 98,31 98,28 C 98,25 95,23 92,23 H 73 Z M 88,40 L 105,65 H 96 L 80,40 H 88 Z"
        fill="currentColor"
      />

      {/* Letter 'I' */}
      <path
        d="M 115,15 H 123 V 65 H 115 V 15 Z"
        fill="currentColor"
      />

      {/* Letter 'Z' (Solid, clean geometric Z) */}
      <path
        d="M 132,15 H 168 V 23 L 142,57 H 168 V 65 H 132 V 57 L 158,23 H 132 V 15 Z"
        fill="currentColor"
      />

      {/* Letter 'O' */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 201,15 C 215,15 226,26 226,40 C 226,54 215,65 201,65 C 187,65 176,54 176,40 C 176,26 187,15 201,15 Z M 201,23 C 192,23 184,31 184,40 C 184,49 192,57 201,57 C 210,57 218,49 218,40 C 218,31 210,23 201,23 Z"
        fill="currentColor"
      />

      {/* Letter 'M' */}
      <path
        d="M 236,15 H 244 V 65 H 236 V 15 Z M 268,15 H 276 V 65 H 268 V 15 Z M 244,15 L 256,48 H 257 L 268,15 H 260 L 256.5,31 L 252,15 H 244 Z"
        fill="currentColor"
      />
    </svg>
  );
}
