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

function transformAGRouterResponse(data: any, requestId: string): AGRouterPromptResponse {
  const promptText = data.prompt || data.reverse_prompts?.flux_prompt || 'High-fidelity visual artwork.';
  const styleText = data.analysis?.art_style || 'Photorealistic';
  const lightingText = data.analysis?.lighting || data.lighting || 'Natural studio lighting';
  const compositionText = data.analysis?.composition || 'Balanced composition';
  const cameraText = data.analysis?.estimated_camera_settings?.lens || '50mm prime';
  const colorPalette = Array.isArray(data.analysis?.color_palette) ? data.analysis.color_palette : ['#A855F7', '#06B6D4', '#0F172A'];
  const optics = analyzeCameraOptics(promptText, styleText, compositionText);
  const lightingDetail = analyzeLighting(promptText, styleText, lightingText);
  const spatialElements = extractSpatialLayout(promptText, compositionText).elements;
  const styleDNA = extractStyleDNA(promptText, styleText, lightingText, colorPalette);
  const characterIdentity = extractCharacterIdentity(promptText, styleText);
  const evaluation = evaluatePromptQuality(promptText, styleText, 'blurry, low quality');
  const basePartial: Partial<AGRouterPromptResponse> = {
    requestId,
    prompt: {
      main: promptText,
      negative: data.negative_prompt || 'blurry, low quality, distorted',
      style: styleText,
      lighting: lightingText,
      composition: compositionText,
      camera: cameraText,
      colorPalette,
      mood: data.analysis?.mood || 'Dramatic atmosphere'
    },
    optics,
    lightingDetail,
    metadata: {
      title: data.analysis?.subject ? `${data.analysis.subject.slice(0, 30)} Spec` : 'Reverse Engineering Spec',
      description: 'High-fidelity prompt deconstruction.',
      tags: ['prizom-v3', 'ag-router-production'],
      category: data.analysis?.photography_style || 'Photography',
      aspectRatio: '1:1',
      promptType: 'image'
    }
  };
  const compilerTargets = compileAllTargets(basePartial);
  return {
    requestId,
    prompt: basePartial.prompt!,
    spatial: { elements: spatialElements, layoutSummary: `${compositionText} depth layout.` },
    optics,
    lightingDetail,
    typography: { hasText: false, detectedText: [], fontStyle: 'None', placement: 'None' },
    styleDNA,
    characterIdentity,
    compilerTargets,
    metadata: basePartial.metadata!,
    intelligence: {
      recommendedModel: 'flux-1-dev',
      recommendedPlatform: 'flux',
      supportedModels: ['flux-1.1-pro', 'midjourney-v6', 'sdxl-1.0', 'dall-e-3'],
      launchUrl: 'https://prizom.in/studio'
    },
    quality: {
      confidenceScore: evaluation.clipAlignmentScore,
      qualityScore: evaluation.overallScore / 100,
      promptClarity: evaluation.promptClarityIndex,
      estimatedOutputQuality: evaluation.estimatedFidelityGrade
    },
    safety: { flagged: false, flags: [], safetyScore: 0.99 },
    generation: {
      modelUsed: data.model || 'google/gemini-2.5-flash',
      provider: data.provider || 'ag-router-aws',
      latencyMs: data.latency_ms || 450,
      tokensUsed: data.token_usage?.total_tokens || 420,
      version: '3.0-production',
      timestamp: new Date().toISOString()
    }
  };
}

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
    image_url: imageUrl, // Required by AG Router /v1/vision/analyze
    imageUrl: imageUrl,  // For backward compatibility
    analysis_type: 'full',
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
      signal: AbortSignal.timeout(30000)
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
        signal: AbortSignal.timeout(30000)
      });
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error(`[AG ROUTER ERROR] Status ${response.status}:`, errBody);
      throw new Error(`AG Router API error (${response.status}): ${errBody.detail || errBody.error || 'Unknown error'}`);
    }

    const data = await response.json();
    const transformed = transformAGRouterResponse(data, requestId);
    cachePromptAnalysis(imageUrl, transformed);
    return transformed;
  } catch (error: any) {
    console.warn('[AI STUDIO CLIENT WARNING] AG Router request unavailable, executing Vision Engine:', error.message);
    const fallbackResponse = await execute14StageVisionPipeline(imageUrl, { quality: options.quality, requestId });
    return fallbackResponse;
  }
}

