# Prizom — Production Reliability Runbook

> **Document status**: Permanent. Update this document whenever infrastructure changes.  
> **Audience**: Engineers, DevOps, and anyone maintaining or deploying Prizom.  
> **Last updated**: 2026-07-17

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Single Source of Truth](#single-source-of-truth)
3. [Environment Variables](#environment-variables)
4. [Deployment Checklist](#deployment-checklist)
5. [Validation Suite](#validation-suite)
6. [Monitoring](#monitoring)
7. [SEO Infrastructure](#seo-infrastructure)
8. [Analytics Infrastructure](#analytics-infrastructure)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Disaster Recovery](#disaster-recovery)

---

## Architecture Overview

```
Prizom Production Stack
─────────────────────────────────────────────────────────
Framework:    Next.js 15 (App Router, Server Components, Server Actions)
Hosting:      Vercel (production: main branch, preview: develop branch)
Database:     Supabase (PostgreSQL + Realtime + SSR SDK + RLS)
Image CDN:    Cloudinary
Email:        Resend
Bot:          Cloudflare Turnstile
Analytics:    Google Analytics 4 (GA4) via @next/third-parties
SEO:          Next.js Metadata API + JSON-LD structured data
─────────────────────────────────────────────────────────
Domain:       https://www.prizom.in  (canonical)
              https://prizom.in      (redirects to www)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/site-config.ts` | **Single source of truth** — all brand, domain, and analytics config |
| `src/lib/environment_audit.ts` | Startup env validation — blocks app if vars are missing |
| `src/app/layout.tsx` | Root layout — metadata, structured data, GA loading |
| `src/app/sitemap.xml/route.ts` | Dynamic XML sitemap |
| `src/app/robots.txt/route.ts` | Dynamic robots.txt with env-aware crawl rules |
| `src/app/api/health/route.ts` | Health check endpoint for monitoring |
| `scripts/validate-production.js` | Pre-deploy validation script |
| `src/components/analytics/GoogleAnalyticsWrapper.tsx` | GA4 loader |
| `src/components/analytics/ConsentRestorer.tsx` | GA4 Consent Mode v2 restoration |

---

## Single Source of Truth

**File**: [`src/lib/site-config.ts`](./src/lib/site-config.ts)

This is the **one and only place** where site-wide configuration is defined.

```typescript
SITE_CONFIG = {
  url,           // Runtime URL (reads NEXT_PUBLIC_SITE_URL, normalized)
  canonicalBase, // Always https://www.prizom.in — used in canonical/structured data
  name,          // 'Prizom'
  tagline,       // 'Collaborative AI Prompt Registry'
  description,   // Default meta description
  gaId,          // Reads NEXT_PUBLIC_GA_ID
  logo,          // '/logo.png'
  ogImage,       // '/opengraph-image' (the Next.js dynamic OG route)
  socials,       // { twitter, instagram, youtube }
}
```

### Rules

1. **Never hardcode the domain.** Use `SITE_CONFIG.canonicalBase` or `getCanonicalUrl(path)`.
2. **Never call `process.env.NEXT_PUBLIC_SITE_URL` directly** in page files. Import from `site-config.ts`.
3. **Never call `process.env.NEXT_PUBLIC_GA_ID` directly** in page files. Use `SITE_CONFIG.gaId`.
4. **Never duplicate the URL normalization logic.** The `resolveSiteUrl()` function in `site-config.ts` is the only place that normalizes URLs.

### `getCanonicalUrl(path)` vs `getSiteUrl(path)`

| Function | Uses | When to use |
|----------|------|-------------|
| `getCanonicalUrl('/prompt/abc')` | `canonicalBase` (always production) | `<link rel="canonical">`, JSON-LD `url` fields |
| `getSiteUrl('/prompt/abc')` | `url` (runtime env) | Internal navigation, previews |

---

## Environment Variables

### Required Variables (app blocks without these)

| Variable | Environment | Purpose |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Supabase service role key (server-only) |
| `RESEND_API_KEY` | All | Transactional email sending |
| `CRON_SECRET` | All | Protects cron endpoints |
| `NEXT_PUBLIC_SITE_URL` | All | Site URL per environment |
| `NEXT_PUBLIC_GA_ID` | All | Google Analytics 4 Measurement ID |

### Optional Variables

| Variable | Purpose |
|----------|---------|
| `CLOUDINARY_CLOUD_NAME` | Image upload/CDN |
| `CLOUDINARY_API_KEY` | Image upload/CDN |
| `CLOUDINARY_API_SECRET` | Image upload/CDN |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Bot protection (forms) |
| `TURNSTILE_SECRET_KEY` | Bot protection (server validation) |

### Per-Environment Values

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Preview URL | `https://www.prizom.in` |
| `NEXT_PUBLIC_GA_ID` | `G-VLMQF0ZLVW` | `G-VLMQF0ZLVW` | `G-VLMQF0ZLVW` |

> **NOTE**: Values are managed in the **Vercel Dashboard → Settings → Environment Variables**.  
> The local `.env.*` files have `localhost` values by design — do NOT copy these to Vercel.

---

## Deployment Checklist

Run this before every production deployment:

### Pre-Deploy

- [ ] `npm run lint` — ESLint passes with no errors
- [ ] `npm run build` — TypeScript build passes
- [ ] `npm run validate:env` — All required env vars are set
- [ ] Confirm Vercel Dashboard has correct `NEXT_PUBLIC_SITE_URL=https://www.prizom.in`
- [ ] Confirm Vercel Dashboard has correct `NEXT_PUBLIC_GA_ID=G-VLMQF0ZLVW`
- [ ] Deploy to preview branch first: `git push origin develop`

### Post-Deploy (Preview)

- [ ] `npm run validate:preview https://prizom-<hash>.vercel.app`
- [ ] Check `/api/health` returns `{"status":"healthy"}`
- [ ] Check `/sitemap.xml` contains `www.prizom.in` URLs (not localhost)
- [ ] Check `/robots.txt` returns expected rules
- [ ] Check homepage has `<link rel="canonical">` pointing to correct URL
- [ ] Check Google Analytics DebugView shows events (if consent granted)

### Post-Deploy (Production)

- [ ] `npm run validate:prod` — Full live check against `https://www.prizom.in`
- [ ] Verify `/api/health` shows `healthy`
- [ ] Verify sitemap at https://www.prizom.in/sitemap.xml
- [ ] Verify robots.txt at https://www.prizom.in/robots.txt
- [ ] Check GA4 Realtime report shows active users
- [ ] Run Rich Results Test: https://search.google.com/test/rich-results

---

## Validation Suite

### Scripts

```bash
# Check only environment variables (no network requests)
npm run validate:env

# Full live check against production
npm run validate:prod

# Full live check against a specific URL
npm run validate:preview https://prizom-abc123.vercel.app

# Full pre-deploy gate: lint + build + env check
npm run pre-deploy
```

### What Gets Validated

| Check | Method |
|-------|--------|
| All required env vars present | `validate:env` |
| NEXT_PUBLIC_SITE_URL not localhost in production | `validate:env` |
| GA ID format (starts with G-) | `validate:env` |
| Homepage returns 200 | `validate:prod` |
| GA script tag in homepage HTML | `validate:prod` |
| No localhost URLs in HTML | `validate:prod` |
| Canonical link tag present | `validate:prod` |
| robots.txt returns 200 | `validate:prod` |
| robots.txt has User-agent and Sitemap fields | `validate:prod` |
| robots.txt doesn't block production crawling | `validate:prod` |
| sitemap.xml returns 200 | `validate:prod` |
| sitemap.xml has correct content-type | `validate:prod` |
| sitemap.xml contains www.prizom.in URLs | `validate:prod` |
| No localhost URLs in sitemap.xml | `validate:prod` |
| /api/health returns healthy status | `validate:prod` |
| favicon.ico loads | `validate:prod` |
| /opengraph-image route returns an image | `validate:prod` |
| JSON-LD Organization schema present | `validate:prod` |
| JSON-LD WebSite schema present | `validate:prod` |
| JSON-LD has no localhost URLs | `validate:prod` |

### Health Check API

```
GET https://www.prizom.in/api/health
```

Returns:

```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "checks": {
    "environment": { "status": "ok", "detail": "..." },
    "siteUrl": { "status": "ok", "detail": "..." },
    "canonicalBase": { "status": "ok", "detail": "..." },
    "analyticsId": { "status": "ok", "detail": "..." }
  },
  "deployment": {
    "vercelEnv": "production",
    "gitCommit": "abc1234",
    "gitBranch": "main",
    "timestamp": "..."
  },
  "responseTimeMs": 12
}
```

---

## Monitoring

### Recommended Monitoring Setup

**UptimeRobot / Better Stack** — Set up monitors for:

| URL | Expected Status | Alert Condition |
|-----|----------------|-----------------|
| `https://www.prizom.in/api/health` | 200 | Status ≠ 200 or body.status ≠ "healthy" |
| `https://www.prizom.in/sitemap.xml` | 200 | Status ≠ 200 |
| `https://www.prizom.in/robots.txt` | 200 | Status ≠ 200 |
| `https://www.prizom.in/` | 200 | Status ≠ 200 |

**Google Search Console** — Check weekly:
- Coverage issues (Excluded, Error)
- Sitemap submission status
- Core Web Vitals

**Google Analytics** — Check after every deployment:
- Realtime → 1+ active users confirms tracking works
- DebugView → test with `?debug=1` in GTM DebugView

### Alert Response SLAs

| Alert | Expected Response Time |
|-------|----------------------|
| Homepage down | < 5 minutes (Vercel rollback) |
| Sitemap broken | < 30 minutes |
| Analytics down | < 2 hours |
| robots.txt blocking production | < 15 minutes |

---

## SEO Infrastructure

### Metadata Architecture

```
layout.tsx → metadataBase = SITE_CONFIG.canonicalBase
          → title, description from SITE_CONFIG
          
prompt/[id]/page.tsx → generateMetadata()
                     → canonical = getCanonicalUrl('/prompt/{id}')
                     → og:image = prompt.image_url || SITE_CONFIG.ogImage
                     
creator/[username]/page.tsx → generateMetadata()
                            → canonical = getCanonicalUrl('/creator/{username}')
                            → og:image = creator.avatar_url || SITE_CONFIG.ogImage
```

### Structured Data (JSON-LD)

Defined in `layout.tsx` via `SITE_CONFIG`:
- **Organization** — name, url, logo, sameAs (social profiles)
- **WebSite** — name, url, SearchAction potentialAction

### Sitemap

- **Route**: `src/app/sitemap.xml/route.ts`
- **Cached**: `s-maxage=86400` (24h) with `stale-while-revalidate=43200` (12h)
- **Includes**: Static pages + up to 2,000 active prompts + up to 1,000 active creators
- **Base URL**: Always `SITE_CONFIG.canonicalBase` (never env-dependent)

### robots.txt

- **Route**: `src/app/robots.txt/route.ts`
- **Environment detection**: Via request `Host` header (safe, cannot be spoofed by env vars)
- **Production**: Allows all except `/admin/`, `/api/`, auth pages, and user-private pages
- **Preview/Staging**: Returns `Disallow: /` to prevent indexing

---

## Analytics Infrastructure

### GA4 Loading Order

1. **`ga-consent-defaults` script** (`beforeInteractive` in layout.tsx)  
   Sets all 4 consent signals to `denied` by default. Reads `localStorage` for pre-existing consent.

2. **`ConsentRestorer` component** (client-side, on hydration)  
   If user previously granted consent, fires `gtag('consent', 'update', { all: 'granted' })`.

3. **`GoogleAnalyticsWrapper` component**  
   Loads `@next/third-parties/google` `<GoogleAnalytics>` with `SITE_CONFIG.gaId`.  
   GA loads regardless of consent — consent mode controls *what data is collected*, not whether GA loads.

4. **`RouteChangeTracker` component** (in Suspense)  
   Fires `page_view` events on every client-side navigation after initial load.

### Consent Mode v2 Signals

| Signal | Default | After Grant |
|--------|---------|------------|
| `analytics_storage` | `denied` | `granted` |
| `ad_storage` | `denied` | `granted` |
| `ad_user_data` | `denied` | `granted` |
| `ad_personalization` | `denied` | `granted` |

### Environment Separation

| Environment | GA Tracking |
|-------------|------------|
| Development (localhost) | GA fires but hits production property — use GA4 DebugView filter |
| Preview (Vercel) | GA fires and hits production property — acceptable for a small team |
| Production | GA fires normally |

> **Note**: For strict separation, use a separate GA4 property for dev/preview and update `NEXT_PUBLIC_GA_ID` per environment in Vercel Dashboard.

---

## Troubleshooting Guide

### ❌ Sitemap contains localhost:3000 URLs

**Cause**: `NEXT_PUBLIC_SITE_URL` is set to `http://localhost:3000` in Vercel production environment.

**Fix**:
1. Go to Vercel Dashboard → prizom-homepage → Settings → Environment Variables
2. Find `NEXT_PUBLIC_SITE_URL` for Production
3. Set to `https://www.prizom.in`
4. Redeploy

**Detection**: `npm run validate:prod` will catch this.

---

### ❌ Google Analytics not recording events

**Diagnosis order**:
1. Open browser → Network tab → search for `google-analytics`  
   If no request: GA script isn't loading
2. Check `NEXT_PUBLIC_GA_ID` is set in Vercel Dashboard for Production
3. Check browser console for `window.gtag` — should be a function
4. Check cookie consent — GA only fires full events if consent is `granted`
5. Check CSP header in `next.config.js` allows `googletagmanager.com`

---

### ❌ robots.txt blocking crawling in production

**Cause**: The `host` header on the request doesn't match `www.prizom.in` or `prizom.in`.

**Diagnosis**:
```bash
curl -H "Host: www.prizom.in" https://www.prizom.in/robots.txt
```

If correct, should show `Allow: /`.

**Fix**: Verify the domain is correctly configured in Vercel and the Host header is being passed through.

---

### ❌ Canonical URL pointing to preview URL

**Cause**: `getCanonicalUrl()` was not used — `getSiteUrl()` was used instead.

**Fix**: In `generateMetadata()`, always use `getCanonicalUrl(path)` for `alternates.canonical`.

---

### ❌ Open Graph image returns 404

**Cause**: OG fallback was pointing to `/og-image.png` (static file that doesn't exist).

**Fix** (already applied): Use `SITE_CONFIG.ogImage` which points to `/opengraph-image` — the Next.js dynamic route (`opengraph-image.tsx`).

---

### ❌ App shows "Configuration Error" screen

**Cause**: One or more required env vars are missing.

**Diagnosis**: Check server logs for the `[FATAL CONFIGURATION ERROR]` block.

**Fix**: Add the missing variable(s) in Vercel Dashboard → Redeploy.

---

### ❌ ConsentRestorer not restoring GA consent

**Symptoms**: User previously granted consent but GA shows `analytics_storage: denied` in DebugView.

**Cause**: `ConsentRestorer` fired before `window.gtag` was initialized.

**Fix**: Ensure `GoogleAnalyticsWrapper` is rendered before `ConsentRestorer` in the DOM order (current `layout.tsx` has this correct).

---

## Disaster Recovery

### Recovery Playbook

#### Scenario 1: Analytics completely stops (no events in GA4 Realtime)

```
1. Check /api/health → look for analyticsId status
2. Check NEXT_PUBLIC_GA_ID in Vercel Dashboard (Production)
3. Verify CSP in next.config.js allows googletagmanager.com
4. Test in browser DevTools → Network → search 'collect' or 'gtag'
5. If ID is wrong: update in Vercel → Redeploy
   ETA: ~3 minutes
```

#### Scenario 2: Sitemap broken or contains localhost

```
1. Run: npm run validate:prod
2. Check NEXT_PUBLIC_SITE_URL in Vercel Dashboard (Production env)
3. Should be: https://www.prizom.in
4. If wrong: Update → Redeploy
   ETA: ~3 minutes
```

#### Scenario 3: Homepage down (5xx or blank)

```
1. Vercel Dashboard → Deployments
2. Find last known-good deployment
3. Click "..." → Promote to Production (instant rollback)
   ETA: ~1 minute
```

#### Scenario 4: robots.txt blocking production indexing

```
1. curl https://www.prizom.in/robots.txt
2. If shows "Disallow: /" → the host detection failed
3. Check domain configuration in Vercel
4. Rollback to previous deployment while diagnosing
   ETA: ~1 minute
```

#### Scenario 5: Metadata/canonical missing entirely

```
1. Check if validateEnvironment() returned success
2. If env check fails, the entire app body is replaced with error screen
3. Check REQUIRED_ENV_VARS in environment_audit.ts
4. Add missing var in Vercel Dashboard → Redeploy
   ETA: ~3 minutes
```

---

## Adding a New Page with SEO

When creating a new public page that should be indexed:

1. **Add `generateMetadata()` to the page file**:
```typescript
import { SITE_CONFIG, getCanonicalUrl } from '@/lib/site-config';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Page Title | ${SITE_CONFIG.name}`,
    description: 'Page description.',
    alternates: {
      canonical: getCanonicalUrl('/your-page-path'),
    },
    openGraph: {
      title: 'Page Title',
      description: 'Page description.',
      url: getCanonicalUrl('/your-page-path'),
      siteName: SITE_CONFIG.name,
    },
  };
}
```

2. **Add the page to the sitemap** in `src/app/sitemap.xml/route.ts` → `staticPages` array.

3. **Check robots.txt** — ensure the path is not in a `Disallow` rule if it should be indexed.

---

## Adding a New Required Environment Variable

1. Add the variable to `REQUIRED_ENV_VARS` in `src/lib/environment_audit.ts`
2. Add the variable to `REQUIRED_ENV_VARS` in `scripts/validate-production.js`
3. Add the value in Vercel Dashboard for all 3 environments (Production, Preview, Development)
4. Document the variable in the table above
5. Update `README.md` with the new variable

---

*This document is the authoritative reference for Prizom production infrastructure. Keep it updated.*
