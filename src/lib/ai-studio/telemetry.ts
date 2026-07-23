import { createAdminClient } from '@/lib/supabase/server';

export interface StudioTelemetryInput {
  requestId: string;
  userId?: string | null;
  sessionId?: string | null;
  modelUsed: string;
  provider: string;
  tokensUsed: number;
  estimatedCost: number;
  latencyMs: number;
  confidenceScore?: number | null;
  qualityScore?: number | null;
  retryCount?: number;
  status: 'success' | 'failed_safety' | 'failed_timeout' | 'failed_api';
}

/**
 * Logs AI inference telemetry and cost metadata into ai_telemetry_logs table.
 */
export async function logStudioTelemetry(
  input: StudioTelemetryInput,
  customClient?: any
): Promise<void> {
  const supabase = customClient || (await createAdminClient());

  const { error } = await supabase
    .from('ai_telemetry_logs')
    .insert([
      {
        request_id: input.requestId,
        user_id: input.userId || null,
        session_id: input.sessionId || null,
        model_used: input.modelUsed,
        provider: input.provider,
        tokens_used: input.tokensUsed,
        estimated_cost: input.estimatedCost,
        latency_ms: input.latencyMs,
        confidence_score: input.confidenceScore || null,
        quality_score: input.qualityScore || null,
        retry_count: input.retryCount || 0,
        status: input.status
      }
    ]);

  if (error) {
    console.error('[TELEMETRY LOG ERROR] Failed to record telemetry entry:', error.message);
  }
}
