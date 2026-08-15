'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createStudioSession, getStudioSession } from '@/lib/ai-studio/session';
import { deductCreditsAtomic, refundCreditsAtomic, getUserCreditBalance } from '@/lib/ai-studio/credits';
import { assertNotSuspendedOrBanned } from './moderation';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { verifyAiStudioAccessServer } from '@/lib/ai-studio/guard';


/**
 * Server action to check user credit balance.
 */
export async function getCreditBalanceAction() {
  const access = await verifyAiStudioAccessServer();
  if (!access.allowed) {
    return { success: false, error: 'Prizom AI Studio is currently in gated Early Access release.' };
  }

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
  meta?: { width?: number; height?: number; aspectRatio?: string },
  turnstileToken?: string
) {
  const access = await verifyAiStudioAccessServer();
  if (!access.allowed) {
    return { success: false, error: 'Prizom AI Studio is currently in gated Early Access release.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required for AI Studio.' };
  }

  try {
    // Assert user standing (banned, suspended)
    await assertNotSuspendedOrBanned(user.id);

    // Idempotency check: Check if user created session for identical image URL recently (within 5 min)
    const { data: existingSession } = await supabase
      .from('ai_studio_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('cloudinary_url', cloudinaryUrl)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      console.log('[STUDIO ACTION IDEMPOTENCY] Found active session for user & URL, re-using session:', existingSession.id);
      return { success: true, session: existingSession, idempotentHit: true };
    }

    // 1. CAPTCHA turnstile check if secret key configured
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const captchaRes = await verifyTurnstileToken(turnstileToken);
      if (!captchaRes.success) {
        return { success: false, error: captchaRes.error || 'CAPTCHA verification failed.' };
      }
    }

    // 2. Perform atomic credit debit (Standard default = 1 credit per generation)
    const cost = 1;
    const deductRes = await deductCreditsAtomic(user.id, cost, 'studio_generation', null);
    if (!deductRes.success) {
      return { success: false, error: deductRes.error || `Insufficient credits. This generation requires ${cost} credit.` };
    }

    // 3. Create session draft entry
    try {
      const session = await createStudioSession(user.id, cloudinaryUrl, cloudinaryPublicId, requestId, meta, supabase);
      
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
      await refundCreditsAtomic(user.id, cost, 'refund_session_init_failure', null);
      throw sessionErr;
    }
  } catch (err: any) {
    console.error('[STUDIO ACTION ERROR] Failed to start studio session:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Server action to mark studio session as complete and save the prompt version iteration.
 */
export async function completeStudioSessionAction(
  sessionId: string,
  versionNumber: number,
  promptText: string,
  negativePrompt: string | null,
  agRouterResponse: any
) {
  const access = await verifyAiStudioAccessServer();
  if (!access.allowed) {
    return { success: false, error: 'Prizom AI Studio is currently in gated Early Access release.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    const { savePromptVersion, completeStudioSession } = await import('@/lib/ai-studio/session');
    
    // Security check: Verify user owns the session
    const { data: session } = await supabase
      .from('ai_studio_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.user_id !== user.id) {
      return { success: false, error: 'Forbidden: You do not own this studio session.' };
    }

    await savePromptVersion(
      sessionId,
      versionNumber,
      promptText,
      negativePrompt,
      { aspect_ratio: agRouterResponse?.metadata?.aspectRatio || '1:1' },
      agRouterResponse,
      true,
      supabase
    );

    await completeStudioSession(sessionId, versionNumber, supabase);

    return { success: true };
  } catch (err: any) {
    console.error('[STUDIO ACTION ERROR] Failed to complete studio session:', err);
    return { success: false, error: err.message || 'Failed to persist prompt version.' };
  }
}

/**
 * Server action to fetch user's past studio generations history.
 */
export async function getUserStudioHistoryAction(limit: number = 30) {
  const access = await verifyAiStudioAccessServer();
  if (!access.allowed) {
    return { success: false, error: 'Prizom AI Studio is currently in gated Early Access release.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    const { getUserStudioSessions } = await import('@/lib/ai-studio/session');
    const history = await getUserStudioSessions(user.id, limit, supabase);
    return { success: true, history };
  } catch (err: any) {
    console.error('[STUDIO ACTION ERROR] Failed to fetch user history:', err);
    return { success: false, error: err.message || 'Failed to fetch history.' };
  }
}

/**
 * Server action to delete a user's past studio session.
 */
export async function deleteStudioSessionAction(sessionId: string) {
  const access = await verifyAiStudioAccessServer();
  if (!access.allowed) {
    return { success: false, error: 'Prizom AI Studio is currently in gated Early Access release.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    const { deleteStudioSession } = await import('@/lib/ai-studio/session');
    const deleted = await deleteStudioSession(sessionId, user.id, supabase);
    if (!deleted) {
      return { success: false, error: 'Failed to delete session or forbidden.' };
    }

    revalidatePath('/studio');
    revalidatePath('/studio/projects');
    revalidatePath('/create/studio');

    return { success: true };
  } catch (err: any) {
    console.error('[STUDIO ACTION ERROR] Failed to delete session:', err);
    return { success: false, error: err.message || 'Failed to delete session.' };
  }
}

/**
 * Server action to automatically refund user credits when AI generation fails.
 */
export async function refundFailedGenerationAction(sessionId: string, reason: string = 'generation_failed') {
  const access = await verifyAiStudioAccessServer();
  if (!access.allowed) {
    return { success: false, error: 'Prizom AI Studio is currently in gated Early Access release.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    const { data: session } = await supabase
      .from('ai_studio_sessions')
      .select('id, user_id, status')
      .eq('id', sessionId)
      .single();

    if (!session || session.user_id !== user.id) {
      return { success: false, error: 'Forbidden or session not found.' };
    }

    await supabase
      .from('ai_studio_sessions')
      .update({ status: 'failed', error_message: reason })
      .eq('id', sessionId);

    const refundRes = await refundCreditsAtomic(user.id, 1, 'failed_generation_refund', sessionId);
    
    revalidatePath('/studio');

    return { success: true, balanceAfter: refundRes.balanceAfter };
  } catch (err: any) {
    console.error('[STUDIO ACTION ERROR] Failed auto-refund for failed generation:', err);
    return { success: false, error: err.message || 'Refund failed' };
  }
}



/**
 * Server action allowing users to claim +5 bonus credits every 24 hours.
 */
export async function claimDailyCreditsAction() {
  const access = await verifyAiStudioAccessServer();
  if (!access.allowed) {
    return { success: false, error: 'Prizom AI Studio is currently in gated Early Access release.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    const { claimDailyCredits } = await import('@/lib/ai-studio/credits');
    const claimRes = await claimDailyCredits(user.id, supabase);
    if (!claimRes.success) {
      return { success: false, error: claimRes.error || 'Failed to claim daily credits.' };
    }
    return { success: true, balance: claimRes.balanceAfter };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to claim daily credits.' };
  }
}


/**
 * Server action to fetch studio session detail and version chain.
 */
export async function getStudioSessionAction(sessionId: string) {
  const access = await verifyAiStudioAccessServer();
  if (!access.allowed) {
    return { success: false, error: 'Prizom AI Studio is currently in gated Early Access release.' };
  }

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
  const access = await verifyAiStudioAccessServer();
  if (!access.allowed) {
    return { success: false, error: 'Prizom AI Studio is currently in gated Early Access release.' };
  }

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
  const access = await verifyAiStudioAccessServer();
  if (!access.allowed) {
    return { success: false, error: 'Prizom AI Studio is currently in gated Early Access release.' };
  }

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
  const access = await verifyAiStudioAccessServer();
  if (!access.allowed) {
    return { success: false, error: 'Prizom AI Studio is currently in gated Early Access release.' };
  }

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
  options: {
    quality?: 'standard' | 'premium';
    requestId?: string;
    sourceDimensions?: { width: number; height: number };
  } = {}
) {
  const access = await verifyAiStudioAccessServer();
  if (!access.allowed) {
    return { success: false, error: 'Prizom AI Studio is currently in gated Early Access release.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required for AI Studio generation.' };
  }

  try {
    // Assert user standing (banned, suspended)
    await assertNotSuspendedOrBanned(user.id);
    const { generatePromptFromImage } = await import('@/lib/ai-studio/client');
    const response = await generatePromptFromImage(imageUrl, options);

    // Asynchronously log telemetry
    try {
      const { logStudioTelemetry } = await import('@/lib/ai-studio/telemetry');
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      logStudioTelemetry({
        requestId: response.requestId,
        userId: user?.id || null,
        modelUsed: response.generation?.modelUsed || 'vision-v3',
        provider: response.generation?.provider || 'ag-router',
        tokensUsed: response.generation?.tokensUsed || 420,
        estimatedCost: 0.0015,
        latencyMs: response.generation?.latencyMs || 450,
        confidenceScore: response.quality?.confidenceScore,
        qualityScore: response.quality?.qualityScore,
        status: 'success'
      }, supabase).catch(() => {});
    } catch (_) {}

    return { success: true, response };
  } catch (err: any) {
    console.error('[STUDIO ACTION ERROR] Failed to analyze image:', err);
    return { success: false, error: err.message || 'Image analysis failed.' };
  }
}

