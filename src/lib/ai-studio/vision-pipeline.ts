import { AGRouterPromptResponse } from './schema';

export interface VisionPipelineOptions {
  quality?: 'standard' | 'premium';
  requestId?: string;
  userContext?: string;
}

/**
 * Direct Vision Provider calls are disabled for production prompt generation.
 * All production requests MUST route through AG Router gateway.
 */
async function callLiveVisionProvider(
  imageUrl: string,
  requestId: string,
  startTime: number
): Promise<AGRouterPromptResponse | null> {
  console.warn('[VISION PIPELINE SECURITY ALERT] Direct live vision provider call attempted and blocked. Request must use AG Router gateway.');
  return null;
}

/**
 * Prizom AI Studio V3 — Vision Perception Pipeline (Deprecated for Production Generation)
 * Enforces FAIL CLOSED policy: throws error if invoked directly without AG Router.
 */
export async function execute14StageVisionPipeline(
  imageUrl: string,
  options: VisionPipelineOptions = {}
): Promise<AGRouterPromptResponse> {
  console.error('[VISION PIPELINE BYPASS ATTEMPT BLOCKED] Direct local vision pipeline execution is forbidden in production.');
  throw new Error('AI generation pipeline bypass detected. All requests must route through AG Router.');
}
