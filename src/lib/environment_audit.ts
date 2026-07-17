/**
 * Prizom Production Environment Validation Audit
 * Ensures crucial environment variables are configured on application startup.
 *
 * MAINTENANCE: When adding a new required env var, add it to REQUIRED_ENV_VARS.
 * The app will refuse to start (showing a config error page) if any are missing.
 */

/**
 * All environment variables that MUST be present for the application to function.
 * Missing any of these will show a boot error and block the app from serving requests.
 */
const REQUIRED_ENV_VARS = [
  // Core infrastructure
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  // Communications
  'RESEND_API_KEY',
  // Security
  'CRON_SECRET',
  // Site identity — must be set in Vercel Dashboard per-environment
  'NEXT_PUBLIC_SITE_URL',
  // Analytics — must be set in Vercel Dashboard; absence = silent GA failure
  'NEXT_PUBLIC_GA_ID',
] as const;

export interface EnvValidationResult {
  success: boolean;
  missing: string[];
  warnings: string[];
  error?: string;
}

export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const v of REQUIRED_ENV_VARS) {
    if (!process.env[v] || process.env[v]!.trim() === '') {
      missing.push(v);
    }
  }

  // Warn if SITE_URL looks like localhost while running on Vercel production.
  // This indicates the Vercel Dashboard env var is misconfigured.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const isVercelProduction = process.env.VERCEL_ENV === 'production';
  if (isVercelProduction && (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1'))) {
    const msg = `NEXT_PUBLIC_SITE_URL is "${siteUrl}" in a Vercel production deployment. ` +
      'This will produce localhost canonical URLs in sitemap and metadata. ' +
      'Update the Production env var in the Vercel Dashboard to https://www.prizom.in';
    warnings.push(msg);
    console.warn(`[CONFIGURATION WARNING] ${msg}`);
  }

  if (missing.length > 0) {
    const errorMsg = `[CRITICAL CONFIGURATION ERROR] Missing required environment variable(s): ${missing.join(', ')}`;

    console.error(`
======================================================================
[FATAL CONFIGURATION ERROR]
The application has failed to boot because one or more required
production environment variables are missing:

${missing.map(v => `  -> ${v} (MISSING)`).join('\n')}

Please configure these variables in your deployment settings (e.g. Vercel Dashboard).
======================================================================
    `);

    return {
      success: false,
      missing,
      warnings,
      error: errorMsg,
    };
  }

  return {
    success: true,
    missing: [],
    warnings,
  };
}
