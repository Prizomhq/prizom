import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Dynamic favicon generator rendering the new branded P logo
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0c',
          borderRadius: 8,
          position: 'relative',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top-Left Blue Triangle */}
          <path d="M 46,16 L 26,27.5 L 46,39 Z" fill="#3b4fe4" />
          {/* Top-Right Purple Triangle */}
          <path d="M 50,17.5 L 50,39.5 L 67,28.5 Z" fill="#802cf6" />
          {/* Stem */}
          <path d="M 26,30 L 44,40.5 L 44,49.5 L 35,55 L 44,60.5 L 44,71.5 L 26,81 Z" fill="#2c3ce6" />
          {/* P Loop */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M 50,27.5 C 65,27.5 76,34 76,44.5 C 76,55 65,61.5 50,61.5 L 50,71.5 C 71,71.5 87,60 87,44.5 C 87,29 71,17.5 50,17.5 Z"
            fill="url(#favGradient)"
          />
          {/* Branching Nodes */}
          <line x1="35" y1="55" x2="51" y2="43" stroke="#a855f7" strokeWidth="3" />
          <circle cx="51" cy="43" r="5" fill="#a855f7" />
          
          <line x1="35" y1="55" x2="62" y2="55" stroke="#a855f7" strokeWidth="3" />
          <circle cx="62" cy="55" r="5" fill="#a855f7" />
          
          <line x1="35" y1="55" x2="51" y2="67" stroke="#a855f7" strokeWidth="3" />
          <circle cx="51" cy="67" r="5" fill="#a855f7" />

          <defs>
            <linearGradient id="favGradient" x1="50" y1="17.5" x2="50" y2="71.5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#802cf6" />
              <stop offset="100%" stopColor="#2c3ce6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
