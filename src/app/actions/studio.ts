'use server';

import { createClient } from '@/lib/supabase/server';
import { createStudioSession, getStudioSession } from '@/lib/ai-studio/session';
import { deductCreditsAtomic, refundCreditsAtomic, getUserCreditBalance } from '@/lib/ai-studio/credits';
import { assertNotSuspendedOrBanned } from './moderation';
import { verifyTurnstileToken } from '@/lib/turnstile';

/**
 * Server action to check user credit balance.
 */
export async function getCreditBalanceAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    const balance = await getUserCreditBalance(user.id, supabase);
    return { success: true, balance };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to check credits' };
  }
}

/**
 * Server action to initiate a new studio session.
 * Handles CAPTCHA verification, permission checks, and atomic credit debiting.
 */
export async function createStudioSessionAction(
  cloudinaryUrl: string,
  cloudinaryPublicId: string,
  requestId: string,
  turnstileToken?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    // Assert user standing (banned, suspended)
    await assertNotSuspendedOrBanned(user.id);

    // 1. CAPTCHA turnstile check if secret key configured
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const captchaRes = await verifyTurnstileToken(turnstileToken);
      if (!captchaRes.success) {
        return { success: false, error: captchaRes.error || 'CAPTCHA verification failed.' };
      }
    }

    // 2. Perform atomic credit debit (1 credit per generation)
    const deductRes = await deductCreditsAtomic(user.id, 1, 'studio_generation', null);
    if (!deductRes.success) {
      return { success: false, error: deductRes.error || 'Insufficient credits.' };
    }

    // 3. Create session draft entry
    try {
      const session = await createStudioSession(user.id, cloudinaryUrl, cloudinaryPublicId, requestId, supabase);
      
      // Update ledger entry with session ID for accurate transaction tracking
      await supabase
        .from('ai_credit_ledger')
        .update({ session_id: session.id })
        .eq('user_id', user.id)
        .eq('reason', 'studio_generation')
        .is('session_id', null);

      return { success: true, session };
    } catch (sessionErr: any) {
      // Refund the debited credit if session initialization fails
      await refundCreditsAtomic(user.id, 1, 'refund_session_init_failure', null);
      throw sessionErr;
    }
  } catch (err: any) {
    console.error('[STUDIO ACTION ERROR] Failed to start studio session:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Server action to fetch studio session detail and version chain.
 */
export async function getStudioSessionAction(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    const data = await getStudioSession(sessionId, supabase);
    if (!data) {
      return { success: false, error: 'Session draft not found.' };
    }

    // Security check: Verify session owner matches current authenticated user
    if (data.session.user_id !== user.id) {
      return { success: false, error: 'Forbidden: You do not own this studio session.' };
    }

    return { success: true, session: data.session, versions: data.versions };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to retrieve session details.' };
  }
}

/**
 * Server action to manually refund credits in case of failures.
 */
export async function refundStudioCreditsAction(
  sessionId: string,
  amount: number,
  reason: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    // Only administrators or the system can trigger manual refunds
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = ['super_admin', 'admin', 'moderator'].includes(profile?.role || 'user');
    if (!isAdmin) {
      return { success: false, error: 'Forbidden: Admin access required.' };
    }

    // Verify session
    const { data: session } = await supabase
      .from('ai_studio_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const refundRes = await refundCreditsAtomic(session.user_id, amount, reason, sessionId);
    return { success: true, balanceAfter: refundRes.balanceAfter };
  } catch (err: any) {
    return { success: false, error: err.message || 'Refund processing failed.' };
  }
}

/**
 * Server action to record human feedback delta metrics.
 */
export async function recordFeedbackDeltaAction(
  sessionId: string,
  originalAiPrompt: string,
  userModifiedPrompt: string,
  modifiedFields: string[] = ['prompt_text']
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    const { recordPromptDeltaFeedback } = await import('@/lib/ai-studio/feedback');
    const delta = await recordPromptDeltaFeedback(
      sessionId,
      originalAiPrompt,
      userModifiedPrompt,
      modifiedFields,
      supabase
    );
    return { success: true, delta };
  } catch (err: any) {
    console.error('[STUDIO ACTION ERROR] Failed to record feedback delta:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Server action to log AI Studio telemetry entries.
 */
export async function logStudioTelemetryAction(input: {
  requestId: string;
  sessionId?: string | null;
  modelUsed: string;
  provider: string;
  tokensUsed: number;
  estimatedCost: number;
  latencyMs: number;
  confidenceScore?: number | null;
  qualityScore?: number | null;
  status: 'success' | 'failed_safety' | 'failed_timeout' | 'failed_api';
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const { logStudioTelemetry } = await import('@/lib/ai-studio/telemetry');
    await logStudioTelemetry(
      {
        ...input,
        userId: user?.id || null
      },
      supabase
    );
    return { success: true };
  } catch (err: any) {
    console.error('[STUDIO ACTION ERROR] Failed to log telemetry:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Server action to securely invoke AG Router image analysis server-side.
 */
export async function analyzeImageStudioAction(
  imageUrl: string,
  options: { quality?: 'standard' | 'premium'; requestId?: string } = {}
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    const { generatePromptFromImage } = await import('@/lib/ai-studio/client');
    const response = await generatePromptFromImage(imageUrl, options);
    return { success: true, response };
  } catch (err: any) {
    console.error('[STUDIO ACTION ERROR] Failed to analyze image:', err);
    return { success: false, error: err.message || 'Image analysis failed.' };
  }
}

