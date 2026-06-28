/**
 * Prizom Production Environment Validation Audit
 * Ensures crucial environment variables are configured on application startup.
 */

const REQUIRED_ENV_VARS = [
  'RESEND_API_KEY',
  'CRON_SECRET',
  'NEXT_PUBLIC_SITE_URL'
];

export interface EnvValidationResult {
  success: boolean;
  missing: string[];
  error?: string;
}

export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = [];

  for (const v of REQUIRED_ENV_VARS) {
    if (!process.env[v] || process.env[v].trim() === '') {
      missing.push(v);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[CRITICAL CONFIGURATION ERROR] Missing required environment variable(s): ${missing.join(', ')}`;
    
    // Log a prominent, highly visible error block to the server logs
    console.error(`
======================================================================
[FATAL CONFIGURATION ERROR]
The application has failed to boot because one or more required 
production environment variables are missing:

${missing.map(v => `  -> ${v} (MISSING)`).join('\n')}

Please configure these variables in your deployment settings (e.g. Vercel dashboard).
======================================================================
    `);

    return {
      success: false,
      missing,
      error: errorMsg
    };
  }

  return {
    success: true,
    missing: []
  };
}
