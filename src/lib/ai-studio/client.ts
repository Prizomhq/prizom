import crypto from 'crypto';
import { AGRouterPromptResponse } from './schema';
import { analyzeCameraOptics, analyzeLighting, extractSpatialLayout, extractTypography } from './analyzer';
import { compileAllTargets } from './compiler';
import { extractStyleDNA } from './style-dna';
import { extractCharacterIdentity } from './identity';
import { getCachedPromptAnalysis, cachePromptAnalysis } from './vector-cache';
import { evaluatePromptQuality } from './evaluator';
import { runAutonomousSelfRefinementLoop } from './autonomous-engine';

const AG_ROUTER_BASE_URL = process.env.AG_ROUTER_BASE_URL || 'http://localhost:4000';
const AG_ROUTER_API_KEY = process.env.AG_ROUTER_API_KEY || 'mock_prizom_api_key';
const AG_ROUTER_HMAC_SECRET = process.env.AG_ROUTER_HMAC_SECRET || 'mock_prizom_hmac_secret';

export function generateHMACSignature(
  path: string,
  bodyString: string,
  timestamp: number,
  nonce: string,
  secret: string
): string {
  const message = `${path}:${bodyString}:${timestamp}:${nonce}`;
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

import { execute14StageVisionPipeline } from './vision-pipeline';

/**
 * Prizom AI Studio V3 — Phase 1 Orchestration Proxy Client
 * Performs zero-latency visual embedding cache checks before dispatching requests to AG Router.
 * Supports HMAC SHA-256 header validation, timestamp nonces, and automatic failover.
 */
export async function generatePromptFromImage(
  imageUrl: string,
  options: { quality?: 'standard' | 'premium'; requestId?: string } = {}
): Promise<AGRouterPromptResponse> {
  const requestId = options.requestId || crypto.randomUUID();

  // 1. Check Vector Similarity Cache first (Zero-latency hit if visual similarity > 0.95)
  const cachedHit = getCachedPromptAnalysis(imageUrl, 0.95);
  if (cachedHit.hit && cachedHit.response) {
    console.log('[AI STUDIO VECTOR CACHE] Hit! Perceptual Cosine Similarity:', cachedHit.similarityScore);
    return {
      ...cachedHit.response,
      requestId
    };
  }

  const path = '/v1/vision/analyze';
  const body = {
    requestId,
    operation: 'image_to_prompt',
    imageUrl,
    context: { platform: 'prizom', version: 'v3-hybrid' },
    qualityLevel: options.quality || 'premium'
  };

  const bodyString = JSON.stringify(body);
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');

  // Verify router URL & credentials
  const hasAgRouterUrl = Boolean(process.env.AG_ROUTER_BASE_URL);
  const isMockKeys = 
    AG_ROUTER_API_KEY === 'mock_prizom_api_key' || 
    AG_ROUTER_HMAC_SECRET === 'mock_prizom_hmac_secret';

  // Check if live direct Vision credentials exist (Gemini / OpenRouter)
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_KEY || process.env.GOOGLE_API_KEY);
  const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY);

  // If AG Router is unconfigured or using mock keys, attempt live Vision engine or local pipeline
  if (!hasAgRouterUrl || isMockKeys) {
    if (hasGeminiKey || hasOpenRouterKey) {
      console.log('[AI STUDIO CLIENT] AG Router unconfigured; engaging Live Vision Provider Pipeline (Gemini / OpenRouter).');
    } else {
      console.log('[AI STUDIO CLIENT] AG Router unconfigured; engaging Vision Perception Pipeline.');
    }
    const response = await execute14StageVisionPipeline(imageUrl, { quality: options.quality, requestId });
    cachePromptAnalysis(imageUrl, response);
    return response;
  }

  // Normalize base URL to strip trailing slash and '/v1'
  const normalizedBase = AG_ROUTER_BASE_URL.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
  const requestUrl = `${normalizedBase}${path}`;

  const signature = generateHMACSignature(path, bodyString, timestamp, nonce, AG_ROUTER_HMAC_SECRET);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AG_ROUTER_API_KEY}`,
    'X-Prizom-Signature': signature,
    'X-Prizom-Timestamp': timestamp.toString(),
    'X-Prizom-Nonce': nonce
  };

  try {
    let response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: bodyString,
      signal: AbortSignal.timeout(6000)
    });

    // Retry with reverse-engineer route if primary route 404s
    if (response.status === 404) {
      const fallbackPath = '/v1/vision/reverse-engineer';
      const fallbackUrl = `${normalizedBase}${fallbackPath}`;
      const fallbackSig = generateHMACSignature(fallbackPath, bodyString, timestamp, nonce, AG_ROUTER_HMAC_SECRET);
      response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'X-Prizom-Signature': fallbackSig
        },
        body: bodyString,
        signal: AbortSignal.timeout(6000)
      });
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `AG Router API responded with status ${response.status}`);
    }

    const data = await response.json();
    cachePromptAnalysis(imageUrl, data);
    return data;
  } catch (error: any) {
    console.warn('[AI STUDIO CLIENT WARNING] AG Router request unavailable, executing Vision Engine:', error.message);
    const fallbackResponse = await execute14StageVisionPipeline(imageUrl, { quality: options.quality, requestId });
    cachePromptAnalysis(imageUrl, fallbackResponse);
    return fallbackResponse;
  }
}

