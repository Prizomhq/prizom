import { NextResponse } from 'next/server';
import { SITE_CONFIG } from '@/lib/site-config';
import { validateEnvironment } from '@/lib/environment_audit';

/**
 * Prizom Health Check Endpoint
 * GET /api/health
 *
 * Returns a structured JSON status report of all critical system components.
 * Used by external monitoring services (UptimeRobot, Better Stack, etc.) and
 * the pre-deploy validation script.
 *
 * Security: Returns no sensitive values. Only status indicators and config metadata.
 * Rate limiting: This route is public but should be monitored for abuse.
 */
export async function GET() {
  const startTime = Date.now();
  const envCheck = validateEnvironment();

  const checks: Record<string, { status: 'ok' | 'warn' | 'fail'; detail?: string }> = {};

  // 1. Environment configuration
  checks.environment = {
    status: envCheck.success ? 'ok' : 'fail',
    detail: envCheck.success
      ? 'All required environment variables present'
      : `Missing: ${envCheck.missing.join(', ')}`,
  };

  // 2. Site URL validation
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const isLocalhostInVercel =
    process.env.VERCEL_ENV === 'production' &&
    (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1'));

  checks.siteUrl = {
    status: isLocalhostInVercel ? 'fail' : 'ok',
    detail: isLocalhostInVercel
      ? `NEXT_PUBLIC_SITE_URL is "${siteUrl}" in Vercel production — update in Vercel Dashboard`
      : `Resolved to: ${SITE_CONFIG.url}`,
  };

  // 3. Canonical base validation
  const canonicalOk = SITE_CONFIG.canonicalBase.startsWith('https://www.prizom.in');
  checks.canonicalBase = {
    status: canonicalOk ? 'ok' : 'warn',
    detail: `Canonical base: ${SITE_CONFIG.canonicalBase}`,
  };

  // 4. Analytics ID presence
  const gaId = SITE_CONFIG.gaId;
  checks.analyticsId = {
    status: gaId && gaId.startsWith('G-') ? 'ok' : 'fail',
    detail: gaId
      ? `GA ID present: ${gaId.slice(0, 5)}...` // Show prefix only, not full ID
      : 'NEXT_PUBLIC_GA_ID is missing or empty',
  };

  // 5. Vercel environment metadata (useful for debugging deployments)
  const deploymentMeta = {
    vercelEnv: process.env.VERCEL_ENV ?? 'not-vercel',
    vercelUrl: process.env.VERCEL_URL ?? 'n/a',
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'n/a',
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? 'n/a',
    nodeVersion: process.version,
    nextVersion: process.env.NEXT_RUNTIME ?? 'n/a',
    timestamp: new Date().toISOString(),
  };

  // 6. Config warnings from env audit
  if (envCheck.warnings.length > 0) {
    checks.configWarnings = {
      status: 'warn',
      detail: envCheck.warnings.join(' | '),
    };
  }

  // Aggregate overall status
  const allStatuses = Object.values(checks).map((c) => c.status);
  const overallStatus = allStatuses.includes('fail')
    ? 'unhealthy'
    : allStatuses.includes('warn')
    ? 'degraded'
    : 'healthy';

  const responseTimeMs = Date.now() - startTime;

  const body = {
    status: overallStatus,
    checks,
    deployment: deploymentMeta,
    responseTimeMs,
  };

  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(body, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Prizom-Health': overallStatus,
    },
  });
}
