#!/usr/bin/env node
/**
 * Prizom Pre-Deploy Production Validation Script
 * ================================================
 * Validates that ALL production infrastructure requirements are met BEFORE
 * a deployment is accepted. Run this script as part of the release pipeline.
 *
 * Usage:
 *   node scripts/validate-production.js                     # Validates env only
 *   node scripts/validate-production.js --url https://www.prizom.in  # Full live check
 *   node scripts/validate-production.js --url https://prizom-abc.vercel.app  # Preview check
 *
 * Exit codes:
 *   0 = All checks passed (deployment safe)
 *   1 = One or more checks failed (deployment should be rejected)
 */

// @ts-check
'use strict';

const path = require('path');
const fs = require('fs');

// Load .env.local for local development runs.
// In Vercel CI, env vars are already injected by the platform — this is a no-op there.
function loadDotEnv() {
  const envFiles = ['.env.local', '.env.production.local', '.env'];
  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        let val = trimmed.slice(eqIndex + 1).trim();
        // Strip surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        // Only set if not already defined (platform vars take precedence)
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
      console.log(`  \x1b[2mLoaded env from ${file}\x1b[0m`);
      break; // Use the first env file found
    }
  }
}

loadDotEnv();

const https = require('https');
const http = require('http');

// ─── Configuration ────────────────────────────────────────────────────────────

const CANONICAL_BASE = 'https://www.prizom.in';
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'CRON_SECRET',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_GA_ID',
];

const EXPECTED_GA_ID_PREFIX = 'G-';
const SITEMAP_REQUIRED_STRINGS = ['<urlset', 'www.prizom.in', '/sitemap'];
const ROBOTS_REQUIRED_STRINGS = ['User-agent:', 'Sitemap:'];
const ROBOTS_FORBIDDEN_STRINGS_IN_PRODUCTION = ['Disallow: /\n']; // full block
const LOCALHOST_PATTERNS = ['localhost', '127.0.0.1', '::1'];

// ─── Utilities ────────────────────────────────────────────────────────────────

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

let passed = 0;
let failed = 0;
let warned = 0;

function pass(label) {
  console.log(`  ${GREEN}✓${RESET} ${label}`);
  passed++;
}

function fail(label, detail) {
  console.log(`  ${RED}✗${RESET} ${RED}${BOLD}${label}${RESET}`);
  if (detail) console.log(`    ${DIM}${detail}${RESET}`);
  failed++;
}

function warn(label, detail) {
  console.log(`  ${YELLOW}⚠${RESET} ${label}`);
  if (detail) console.log(`    ${DIM}${detail}${RESET}`);
  warned++;
}

function section(title) {
  console.log(`\n${BOLD}${title}${RESET}`);
}

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const timeout = options.timeout || 10000;
    const req = lib.get(url, { timeout }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error(`Request timed out: ${url}`)); });
    req.on('error', reject);
  });
}

// ─── Phase 1: Environment Variables ──────────────────────────────────────────

function checkEnvironment() {
  section('Phase 1 — Environment Variables');

  for (const key of REQUIRED_ENV_VARS) {
    const val = process.env[key];
    if (!val || val.trim() === '') {
      fail(`${key}`, 'Missing or empty — set this in Vercel Dashboard');
    } else {
      pass(`${key} is set`);
    }
  }

  // Specific value validations
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const gaId = process.env.NEXT_PUBLIC_GA_ID ?? '';
  const vercelEnv = process.env.VERCEL_ENV ?? '';

  // Warn if SITE_URL is localhost in Vercel production
  if (vercelEnv === 'production' && LOCALHOST_PATTERNS.some(p => siteUrl.includes(p))) {
    fail(
      'NEXT_PUBLIC_SITE_URL is localhost in Vercel production environment',
      `Current value: "${siteUrl}". Update in Vercel Dashboard → Settings → Environment Variables`
    );
  } else if (siteUrl && !LOCALHOST_PATTERNS.some(p => siteUrl.includes(p))) {
    pass('NEXT_PUBLIC_SITE_URL is not a localhost value');
  }

  // Validate GA ID format
  if (gaId && !gaId.startsWith(EXPECTED_GA_ID_PREFIX)) {
    warn(
      `NEXT_PUBLIC_GA_ID does not start with "${EXPECTED_GA_ID_PREFIX}"`,
      `Current value prefix: "${gaId.slice(0, 8)}...". Expected format: G-XXXXXXXXXX`
    );
  } else if (gaId) {
    pass(`NEXT_PUBLIC_GA_ID has correct format (${gaId.slice(0, 5)}...)`);
  }

  // Warn if SITE_URL still has bare domain (should be www)
  if (siteUrl.includes('://prizom.in') && !siteUrl.includes('://www.prizom.in')) {
    warn(
      'NEXT_PUBLIC_SITE_URL uses bare domain "prizom.in" instead of "www.prizom.in"',
      'This may cause canonical inconsistency. Use https://www.prizom.in'
    );
  }
}

// ─── Phase 2: Live URL Checks ─────────────────────────────────────────────────

async function checkLiveUrls(baseUrl) {
  section(`Phase 2 — Live URL Checks (${baseUrl})`);

  // 2a. Homepage
  try {
    const res = await fetch(`${baseUrl}/`);
    if (res.status === 200) {
      pass('Homepage returns 200');
    } else {
      fail('Homepage', `Expected 200, got ${res.status}`);
    }

    // Check for GA script
    const hasGaScript = res.body.includes('googletagmanager.com') || res.body.includes('gtag');
    if (hasGaScript) {
      pass('GA script reference found in HTML');
    } else {
      fail('GA script not found in homepage HTML', 'Check NEXT_PUBLIC_GA_ID and GoogleAnalyticsWrapper');
    }

    // Check for localhost URLs leaking into production HTML
    const localhostLeak = LOCALHOST_PATTERNS.some(p => res.body.includes(`"http://${p}`) || res.body.includes(`href="http://${p}`));
    if (localhostLeak) {
      fail('Localhost URL detected in homepage HTML', 'A localhost URL is leaking into production output. Check NEXT_PUBLIC_SITE_URL.');
    } else {
      pass('No localhost URLs detected in homepage HTML');
    }

    // Check for canonical tag
    if (res.body.includes('rel="canonical"')) {
      pass('Canonical link tag present in homepage HTML');
      // Check canonical points to www
      if (res.body.includes(`canonical" href="https://www.prizom.in`)) {
        pass('Canonical URL is correct (www.prizom.in)');
      } else if (res.body.includes('canonical" href="http://localhost')) {
        fail('Canonical URL points to localhost', 'Metadata metadataBase is resolving to localhost');
      }
    } else {
      warn('Canonical link tag not detected in homepage HTML', 'May be added dynamically — verify in browser DevTools');
    }

  } catch (e) {
    fail('Homepage request failed', e.message);
  }

  // 2b. robots.txt
  try {
    const res = await fetch(`${baseUrl}/robots.txt`);
    if (res.status === 200) {
      pass('robots.txt returns 200');
    } else {
      fail('robots.txt', `Expected 200, got ${res.status}`);
    }

    for (const str of ROBOTS_REQUIRED_STRINGS) {
      if (res.body.includes(str)) {
        pass(`robots.txt contains "${str}"`);
      } else {
        fail(`robots.txt missing "${str}"`, `Full response:\n${res.body.slice(0, 300)}`);
      }
    }

    // On production URL check: robots.txt should NOT have "Disallow: /" as a full block
    if (baseUrl.includes('www.prizom.in') || baseUrl.includes('prizom.in')) {
      if (res.body.trim().includes('Disallow: /\n') && !res.body.includes('Allow:')) {
        fail(
          'robots.txt fully blocks crawling on production domain',
          'The production robots.txt is returning "Disallow: /" which blocks all search engine indexing.'
        );
      } else {
        pass('robots.txt allows crawling on production domain');
      }
    }

    // Check sitemap reference
    if (res.body.includes(`${CANONICAL_BASE}/sitemap.xml`)) {
      pass(`robots.txt references canonical sitemap URL`);
    } else if (res.body.includes('/sitemap.xml')) {
      warn('robots.txt references sitemap but URL may not be canonical', `Expected: ${CANONICAL_BASE}/sitemap.xml`);
    }

  } catch (e) {
    fail('robots.txt request failed', e.message);
  }

  // 2c. sitemap.xml
  try {
    const res = await fetch(`${baseUrl}/sitemap.xml`);
    if (res.status === 200) {
      pass('sitemap.xml returns 200');
    } else {
      fail('sitemap.xml', `Expected 200, got ${res.status}`);
    }

    // Check content type
    const contentType = res.headers['content-type'] ?? '';
    if (contentType.includes('xml')) {
      pass('sitemap.xml has correct XML content-type');
    } else {
      warn('sitemap.xml content-type may be incorrect', `Got: ${contentType}`);
    }

    // Check for required strings
    for (const str of SITEMAP_REQUIRED_STRINGS) {
      if (res.body.includes(str)) {
        pass(`sitemap.xml contains "${str}"`);
      } else {
        fail(`sitemap.xml missing "${str}"`, `First 500 chars:\n${res.body.slice(0, 500)}`);
      }
    }

    // CRITICAL: Check for localhost URLs in sitemap
    const hasLocalhostInSitemap = LOCALHOST_PATTERNS.some(p => res.body.includes(`http://${p}`));
    if (hasLocalhostInSitemap) {
      fail(
        'Localhost URLs detected in sitemap.xml',
        'NEXT_PUBLIC_SITE_URL is resolving to localhost. Check Vercel Dashboard environment variables.'
      );
    } else {
      pass('No localhost URLs detected in sitemap.xml');
    }

    // Check entry count
    const entryCount = (res.body.match(/<loc>/g) || []).length;
    if (entryCount > 0) {
      pass(`sitemap.xml has ${entryCount} URL entries`);
    } else {
      warn('sitemap.xml has 0 URL entries', 'Static pages at minimum should be present');
    }

  } catch (e) {
    fail('sitemap.xml request failed', e.message);
  }

  // 2d. Health check endpoint
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    if (res.status === 200) {
      pass('/api/health returns 200');
      try {
        const data = JSON.parse(res.body);
        if (data.status === 'healthy') {
          pass('/api/health reports healthy status');
        } else if (data.status === 'degraded') {
          warn('/api/health reports degraded status', JSON.stringify(data.checks, null, 2));
        } else {
          fail('/api/health reports unhealthy status', JSON.stringify(data.checks, null, 2));
        }
      } catch {
        warn('/api/health response is not valid JSON');
      }
    } else if (res.status === 404) {
      warn('/api/health not found (404)', 'The health endpoint is new — deploy the code to enable it. Other checks are authoritative.');
    } else {
      fail('/api/health', `Expected 200, got ${res.status}`);
    }
  } catch (e) {
    warn('/api/health request failed', `${e.message} — endpoint may not be deployed yet`);
  }

  // 2e. Favicon
  try {
    const res = await fetch(`${baseUrl}/favicon.ico`);
    if (res.status === 200) {
      pass('favicon.ico loads successfully');
    } else {
      warn('favicon.ico', `Got ${res.status} — check /app/favicon.ico exists`);
    }
  } catch (e) {
    warn('favicon.ico request failed', e.message);
  }

  // 2f. OG image route
  try {
    const res = await fetch(`${baseUrl}/opengraph-image`);
    if (res.status === 200) {
      pass('/opengraph-image returns 200');
      const ct = res.headers['content-type'] ?? '';
      if (ct.includes('image')) {
        pass('/opengraph-image returns an image content-type');
      } else {
        warn('/opengraph-image content-type unexpected', `Got: ${ct}`);
      }
    } else {
      fail('/opengraph-image', `Expected 200, got ${res.status}`);
    }
  } catch (e) {
    fail('/opengraph-image request failed', e.message);
  }
}

// ─── Phase 3: Structured Data Check ─────────────────────────────────────────

async function checkStructuredData(baseUrl) {
  section('Phase 3 — Structured Data');
  try {
    const res = await fetch(`${baseUrl}/`);
    const hasLdJson = res.body.includes('application/ld+json');
    if (hasLdJson) {
      pass('JSON-LD structured data block found in homepage HTML');

      const hasOrg = res.body.includes('"Organization"');
      const hasWebsite = res.body.includes('"WebSite"');
      const hasPotentialAction = res.body.includes('"SearchAction"');

      if (hasOrg) pass('Organization schema present');
      else fail('Organization schema missing from JSON-LD');

      if (hasWebsite) pass('WebSite schema present');
      else fail('WebSite schema missing from JSON-LD');

      if (hasPotentialAction) pass('SearchAction potentialAction present');
      else warn('SearchAction potentialAction not detected');

      // Check structured data does NOT contain localhost
      const localhostInLdJson = LOCALHOST_PATTERNS.some(p =>
        res.body.includes(`"http://${p}`)
      );
      if (localhostInLdJson) {
        fail('Localhost URL detected in JSON-LD structured data', 'SITE_CONFIG.canonicalBase should always be https://www.prizom.in');
      } else {
        pass('No localhost URLs in JSON-LD structured data');
      }

    } else {
      fail('No JSON-LD structured data found in homepage HTML');
    }
  } catch (e) {
    fail('Structured data check failed', e.message);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function printSummary() {
  console.log('\n' + '─'.repeat(60));
  console.log(`${BOLD}Prizom Pre-Deploy Validation Summary${RESET}`);
  console.log('─'.repeat(60));
  console.log(`  ${GREEN}Passed:${RESET}  ${passed}`);
  console.log(`  ${YELLOW}Warnings:${RESET} ${warned}`);
  console.log(`  ${RED}Failed:${RESET}  ${failed}`);
  console.log('─'.repeat(60));

  if (failed === 0) {
    console.log(`\n${GREEN}${BOLD}✓ All checks passed. Deployment is safe to proceed.${RESET}\n`);
    return 0;
  } else {
    console.log(`\n${RED}${BOLD}✗ ${failed} check(s) failed. Deployment should be rejected.${RESET}`);
    console.log(`${DIM}  Fix the above issues before deploying to production.${RESET}\n`);
    return 1;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}Prizom Pre-Deploy Validation${RESET}`);
  console.log(`${DIM}${new Date().toISOString()}${RESET}`);
  console.log('─'.repeat(60));

  // Parse --url argument
  const urlArgIndex = process.argv.indexOf('--url');
  const targetUrl = urlArgIndex !== -1 ? process.argv[urlArgIndex + 1] : null;

  // Phase 1: Always check environment
  checkEnvironment();

  // Phase 2 & 3: Only if URL provided
  if (targetUrl) {
    await checkLiveUrls(targetUrl);
    await checkStructuredData(targetUrl);
  } else {
    section('Phase 2 & 3 — Live URL Checks (skipped)');
    console.log(`  ${DIM}Pass --url <URL> to run live checks against a deployment.${RESET}`);
    console.log(`  ${DIM}Example: node scripts/validate-production.js --url https://www.prizom.in${RESET}`);
  }

  const exitCode = printSummary();
  process.exit(exitCode);
}

main().catch((e) => {
  console.error(`\n${RED}Fatal error in validation script:${RESET}`, e);
  process.exit(1);
});
