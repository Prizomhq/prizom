/**
 * Prizom — Single Source of Truth Configuration
 *
 * This is the ONE place where site-wide constants are defined.
 * All other files (layout, sitemap, robots.txt, metadata generators)
 * MUST import from this file. Do NOT duplicate these values elsewhere.
 *
 * Deployment: NEXT_PUBLIC_SITE_URL is set in the Vercel Dashboard per environment.
 * Local dev:  NEXT_PUBLIC_SITE_URL=http://localhost:3000 (correct for local)
 * Production: NEXT_PUBLIC_SITE_URL=https://www.prizom.in (set in Vercel Dashboard)
 */

/** Normalise a raw NEXT_PUBLIC_SITE_URL value:
 *  - Strips trailing slash
 *  - Upgrades prizom.in → www.prizom.in
 *  - Falls back to canonical production URL when in a non-local production context
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  // If the env is empty or clearly a localhost value, keep it as-is for local dev.
  // For production Vercel deployments, Vercel injects the correct value.
  let url = raw.trim().replace(/\/$/, ''); // strip trailing slash

  // Upgrade bare domain to www — ensures canonical consistency
  if (url.includes('://prizom.in')) {
    url = url.replace('://prizom.in', '://www.prizom.in');
  }

  // Hard fallback: if env is genuinely empty, use the production canonical.
  // This should only occur in edge cases (e.g. standalone docker builds).
  if (!url) {
    url = 'https://www.prizom.in';
  }

  return url;
}

export const SITE_CONFIG = {
  /** Fully resolved site URL — reads from NEXT_PUBLIC_SITE_URL, normalised. */
  url: resolveSiteUrl(),

  /** Canonical production domain (always www, always https). Used in structured data. */
  canonicalBase: 'https://www.prizom.in',

  /** Brand name */
  name: 'Prizom',

  /** Short tagline used in titles and descriptions */
  tagline: 'Collaborative AI Prompt Registry',

  /** Default meta description */
  description:
    'Discover, save, remix, and showcase next-generation AI prompts in a collaborative registry.',

  /** Google Analytics 4 Measurement ID */
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? '',

  /** Absolute path to the logo (served from /public) */
  logo: '/logo.png',

  /**
   * Default Open Graph image.
   * Points to the Next.js opengraph-image.tsx route which generates it dynamically.
   * Do NOT point to a static /og-image.png — that file does not exist.
   */
  ogImage: '/opengraph-image',

  /** Social media profile URLs for structured data sameAs */
  socials: {
    twitter: 'https://x.com/prizomHQ',
    instagram: 'https://instagram.com/prizomHQ',
    youtube: 'https://youtube.com/prizomhq',
  },
} as const;

/**
 * Returns a fully-qualified canonical URL for a given path.
 * Always uses the canonical production base (www.prizom.in), not the env SITE_URL.
 * This ensures canonical tags are stable and do not vary between environments.
 *
 * @param path - e.g. '/prompt/abc123'  (leading slash required)
 */
export function getCanonicalUrl(path: string): string {
  const base = SITE_CONFIG.canonicalBase;
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalised}`;
}

/**
 * Returns a fully-qualified OG/sitemap URL using the runtime SITE_URL.
 * In production this equals canonicalBase. In local dev it returns localhost.
 *
 * @param path - e.g. '/prompt/abc123'  (leading slash required)
 */
export function getSiteUrl(path = ''): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${normalised}`;
}
