import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Open Graph standard size
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          fontFamily: 'sans-serif',
          position: 'relative',
          padding: '40px',
        }}
      >
        {/* Decorative Grid Patterns & Neon Blurs */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            left: '-150px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'rgba(59, 79, 228, 0.12)',
            filter: 'blur(120px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            right: '-150px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'rgba(128, 44, 246, 0.12)',
            filter: 'blur(120px)',
          }}
        />

        {/* Central Card with Prizom Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            marginBottom: '40px',
          }}
        >
          {/* SVG Prizom Logo (Scaled Up) */}
          <svg
            width="120"
            height="120"
            viewBox="25 15 63 67"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top-Left Blue Facet */}
            <path d="M 46,16 L 26,27.5 L 46,39 Z" fill="#3b4fe4" />
            {/* Top-Right Purple Facet */}
            <path d="M 50,17.5 L 50,39.5 L 67,28.5 Z" fill="#802cf6" />
            {/* Stem */}
            <path d="M 26,30 L 44,40.5 L 44,49.5 L 35,55 L 44,60.5 L 44,71.5 L 26,81 Z" fill="#2c3ce6" />
            {/* P Loop */}
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M 50,27.5 C 65,27.5 76,34 76,44.5 C 76,55 65,61.5 50,61.5 L 50,71.5 C 71,71.5 87,60 87,44.5 C 87,29 71,17.5 50,17.5 Z"
              fill="url(#ogGradient)"
            />
            {/* Branching Nodes */}
            <line x1="35" y1="55" x2="51" y2="43" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="51" cy="43" r="4" fill="#a855f7" />
            
            <line x1="35" y1="55" x2="62" y2="55" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="62" cy="55" r="4" fill="#a855f7" />
            
            <line x1="35" y1="55" x2="51" y2="67" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="51" cy="67" r="4" fill="#a855f7" />

            <defs>
              <linearGradient id="ogGradient" x1="50" y1="17.5" x2="50" y2="71.5" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#802cf6" />
                <stop offset="100%" stopColor="#2c3ce6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Wordmark */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontSize: '76px',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              Prizom
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#802cf6',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                marginTop: '8px',
              }}
            >
              AI Prompt Platform
            </span>
          </div>
        </div>

        {/* Dynamic Title / Tagline */}
        <span
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#e4e4e7',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.3,
            marginBottom: '16px',
          }}
        >
          The Collaborative AI Image Prompt Registry
        </span>

        {/* Features / Details bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: '#a1a1aa',
            fontSize: '16px',
            fontWeight: 600,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 28px',
            borderRadius: '999px',
          }}
        >
          <span>Discover Prompts</span>
          <span style={{ color: '#3f3f46' }}>•</span>
          <span>Remix Formulas</span>
          <span style={{ color: '#3f3f46' }}>•</span>
          <span>Analyze Settings</span>
          <span style={{ color: '#3f3f46' }}>•</span>
          <span>Zero Lock-In</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
