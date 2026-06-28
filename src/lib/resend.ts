/**
 * Lightweight, native server-side Resend email dispatcher utilizing native fetch.
 * Bypasses dependency installations and type conflicts in Next.js builds.
 */
export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    console.warn('[RESEND WARNING] RESEND_API_KEY is not defined. Email delivery is mocked via console logs.');
    return { 
      success: false, 
      mocked: true, 
      error: 'RESEND_API_KEY environment variable is not defined' 
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[RESEND SUCCESS] Email successfully dispatched to ${to}. Message ID: ${data.id}`);
      return { success: true, messageId: data.id };
    } else {
      console.error(`[RESEND ERROR] Failed to dispatch email via Resend API:`, data);
      return { success: false, error: data.message || 'Resend API returned an error status' };
    }
  } catch (err: any) {
    console.error(`[RESEND EXCEPTION] Network error encountered during email dispatch to ${to}:`, err);
    return { success: false, error: err.message || 'Network fetch exception occurred' };
  }
}
