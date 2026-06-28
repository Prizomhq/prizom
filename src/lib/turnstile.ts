/**
 * Server-side helper to verify Cloudflare Turnstile CAPTCHA tokens.
 */
export async function verifyTurnstileToken(token?: string): Promise<{ success: boolean; error?: string }> {
  if (!token) {
    return { success: false, error: 'CAPTCHA verification token is missing.' };
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error('[TURNSTILE ERROR] TURNSTILE_SECRET_KEY is not configured.');
    return { success: false, error: 'CAPTCHA service is unconfigured.' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();
    
    if (data.success) {
      return { success: true };
    }

    const errorCodes = data['error-codes'] || [];
    console.warn('[TURNSTILE FAIL] Verification failed:', errorCodes);
    return { success: false, error: 'CAPTCHA check failed. Please check your network or refresh and retry.' };
  } catch (err: any) {
    console.error('[TURNSTILE EXCEPTION] Exception during verification:', err);
    return { success: false, error: 'Server was unable to contact CAPTCHA provider.' };
  }
}
