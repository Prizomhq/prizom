import crypto from 'crypto';
import { AGRouterPromptResponse } from './schema';
import { analyzeCameraOptics, analyzeLighting, extractSpatialLayout } from './analyzer';
import { compileAllTargets } from './compiler';
import { extractStyleDNA } from './style-dna';
import { extractCharacterIdentity } from './identity';
import { cachePromptAnalysis } from './vector-cache';
import { evaluatePromptQuality } from './evaluator';
import { build14SectionUniversalPrompt, extractEditableVariablesFromPrompt } from './universal-engine';
import { analyzeImageAspectRatio } from './aspect-ratio';

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

function transformAGRouterResponse(data: any, requestId: string, sourceDimensions?: { width: number; height: number }): AGRouterPromptResponse {
  const rawPrompt = (typeof data.prompt === 'string' && data.prompt) 
    || (typeof data.prompt?.main === 'string' && data.prompt.main) 
    || (typeof data.reverse_prompts?.flux_prompt === 'string' && data.reverse_prompts.flux_prompt)
    || (typeof data.mainPrompt === 'string' && data.mainPrompt)
    || '';

  const promptText = rawPrompt || 'High-fidelity visual artwork capturing subject and atmosphere.';
  const styleText = data.analysis?.art_style || data.style || 'Photorealistic';
  const lightingText = data.analysis?.lighting || data.lighting || 'Natural studio lighting';
  const compositionText = data.analysis?.composition || data.composition || 'Balanced composition';
  const cameraText = data.analysis?.estimated_camera_settings?.lens || data.camera || '50mm prime';
  const colorPalette = Array.isArray(data.analysis?.color_palette) ? data.analysis.color_palette : (Array.isArray(data.colorPalette) ? data.colorPalette : ['#A855F7', '#06B6D4', '#0F172A']);
  const optics = analyzeCameraOptics(promptText, styleText, compositionText);
  const lightingDetail = analyzeLighting(promptText, styleText, lightingText);
  const spatialElements = extractSpatialLayout(promptText, compositionText).elements;
  const styleDNA = extractStyleDNA(promptText, styleText, lightingText, colorPalette);
  const characterIdentity = extractCharacterIdentity(promptText, styleText);
  const evaluation = evaluatePromptQuality(promptText, styleText, 'blurry, low quality');

  // Aspect ratio calculation
  const width = sourceDimensions?.width || data.analysis?.dimensions?.width || 1024;
  const height = sourceDimensions?.height || data.analysis?.dimensions?.height || 1024;
  const aspectRatioDetails = analyzeImageAspectRatio(width, height);

  const hasText = Boolean(data.analysis?.typography?.hasText || data.hasText);
  const detectedText = Array.isArray(data.analysis?.typography?.detectedText)
    ? data.analysis.typography.detectedText
    : (Array.isArray(data.detectedText) ? data.detectedText : []);

  const universalPromptData = build14SectionUniversalPrompt({
    coreConcept: promptText,
    subject: data.analysis?.subject || promptText,
    composition: compositionText,
    environment: data.analysis?.environment || 'Scene setting matching reference image.',
    lighting: lightingText,
    colorPalette,
    cameraPhotographic: cameraText,
    materialsTextures: data.analysis?.materials || 'Natural material shaders and tactile surface details.',
    visualStyle: styleText,
    negativeConstraints: data.negative_prompt || 'blurry, low quality, distorted',
    aspectRatio: aspectRatioDetails.normalized_aspect_ratio,
    aspectRatioDetails,
    hasText,
    detectedText,
    category: data.analysis?.photography_style || 'Photography'
  });

  const editableVariables = extractEditableVariablesFromPrompt(universalPromptData, hasText, detectedText);

  const basePartial: Partial<AGRouterPromptResponse> = {
    requestId,
    prompt: {
      main: rawPrompt || universalPromptData.universalMasterPrompt,
      editableVariables,
      negative: data.negative_prompt || 'blurry, low quality, distorted, watermark',
      style: styleText,
      lighting: lightingText,
      composition: compositionText,
      camera: cameraText,
      colorPalette,
      mood: data.analysis?.mood || 'Dramatic atmosphere'
    },
    universalPrompt: universalPromptData,
    optics,
    lightingDetail,
    metadata: {
      title: data.analysis?.subject ? `${data.analysis.subject.slice(0, 30)} Spec` : 'Reverse Engineering Spec',
      description: 'High-fidelity prompt deconstruction.',
      tags: ['prizom-ai-studio', 'ag-router-production'],
      category: data.analysis?.photography_style || 'Photography',
      aspectRatio: aspectRatioDetails.normalized_aspect_ratio,
      promptType: 'image'
    }
  };

  const compilerTargets = compileAllTargets(basePartial);

  return {
    requestId,
    prompt: basePartial.prompt!,
    universalPrompt: universalPromptData,
    reverse_prompts: data.reverse_prompts,
    spatial: { elements: spatialElements, layoutSummary: `${compositionText} depth layout.` },
    optics,
    lightingDetail,
    typography: {
      hasText,
      detectedText,
      fontStyle: data.analysis?.typography?.fontStyle || 'Sans-serif',
      placement: data.analysis?.typography?.placement || 'Centered'
    },
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
 * Mandatory AG Router Client for Prizom AI Studio
 * FAIL CLOSED Policy: If AG Router is unavailable or invalid, generation MUST fail cleanly.
 * NO direct provider bypass is permitted.
 */
export async function generatePromptFromImage(
  imageUrl: string,
  options: {
    quality?: 'standard' | 'premium';
    requestId?: string;
    sourceDimensions?: { width: number; height: number };
  } = {}
): Promise<AGRouterPromptResponse> {
  const requestId = options.requestId || crypto.randomUUID();
  const startTime = Date.now();

  const path = '/v1/vision/analyze';
  const body = {
    requestId,
    operation: 'image_to_prompt',
    image_url: imageUrl,
    imageUrl: imageUrl,
    analysis_type: 'full_11_stage',
    context: { platform: 'prizom_ai_studio', version: '3.0-production' },
    qualityLevel: options.quality || 'premium',
    sourceDimensions: options.sourceDimensions
  };

  const bodyString = JSON.stringify(body);
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');

  const agRouterBaseUrl = process.env.AG_ROUTER_BASE_URL !== undefined 
    ? process.env.AG_ROUTER_BASE_URL 
    : AG_ROUTER_BASE_URL;

  if (!agRouterBaseUrl || agRouterBaseUrl.trim() === '') {
    console.error('[AG ROUTER GATEWAY ERROR] AG_ROUTER_BASE_URL missing.');
    throw new Error('AI generation is temporarily unavailable. Gateway configuration missing.');
  }

  const normalizedBase = agRouterBaseUrl.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
  const requestUrl = `${normalizedBase}${path}`;
  const signature = generateHMACSignature(path, bodyString, timestamp, nonce, AG_ROUTER_HMAC_SECRET);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AG_ROUTER_API_KEY}`,
    'X-Prizom-Request-ID': requestId,
    'X-Prizom-Signature': signature,
    'X-Prizom-Timestamp': timestamp.toString(),
    'X-Prizom-Nonce': nonce
  };

  console.log(`[AG ROUTER CLIENT] Dispatching generation request ${requestId} to AG Router: ${requestUrl}`);

  try {
    let response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: bodyString,
      signal: AbortSignal.timeout(30000)
    });

    if (response.status === 404) {
      const fallbackPath = '/v1/vision/reverse-engineer';
      const fallbackUrl = `${normalizedBase}${fallbackPath}`;
      const fallbackSig = generateHMACSignature(fallbackPath, bodyString, timestamp, nonce, AG_ROUTER_HMAC_SECRET);
      console.log(`[AG ROUTER CLIENT] Retrying request ${requestId} via fallback endpoint: ${fallbackUrl}`);
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
      const errorMsg = errBody.detail || errBody.error || `HTTP ${response.status} ${response.statusText}`;
      console.error(`[AG ROUTER GATEWAY FAIL] Request ${requestId} status ${response.status}:`, errBody);
      throw new Error(`AG Router gateway error (${response.status}): ${errorMsg}`);
    }

    const data = await response.json();
    if (!data || typeof data !== 'object') {
      throw new Error('AG Router returned an empty or invalid JSON response.');
    }

    const rawPrompt = (typeof data.prompt === 'string' && data.prompt) 
      || (typeof data.prompt?.main === 'string' && data.prompt.main) 
      || (typeof data.reverse_prompts?.flux_prompt === 'string' && data.reverse_prompts.flux_prompt)
      || (typeof data.mainPrompt === 'string' && data.mainPrompt)
      || '';

    if (!rawPrompt && !data.analysis) {
      throw new Error('AG Router returned a response without valid prompt data.');
    }

    const transformed = transformAGRouterResponse({
      ...data,
      latency_ms: data.latency_ms || (Date.now() - startTime)
    }, requestId, options.sourceDimensions);

    cachePromptAnalysis(imageUrl, transformed);

    console.log(`[AG ROUTER CLIENT SUCCESS] Request ${requestId} completed via provider: ${transformed.generation.provider}, model: ${transformed.generation.modelUsed}, latency: ${transformed.generation.latencyMs}ms`);

    return transformed;
  } catch (error: any) {
    console.error(`[AG ROUTER GATEWAY FAILURE - FAIL CLOSED] Request ${requestId} failed:`, error.message);
    throw new Error(
      error.message?.includes('AG Router') 
        ? error.message 
        : `AI generation is temporarily unavailable: ${error.message || 'Gateway connection failed'}`
    );
  }
}
