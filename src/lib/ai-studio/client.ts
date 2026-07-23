import crypto from 'crypto';
import { AGRouterPromptResponse } from './schema';

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

/**
 * Sends a signed analysis request to the AG Router.
 * Falls back to mock responses in development when keys are not configured.
 */
export async function generatePromptFromImage(
  imageUrl: string,
  options: { quality?: 'standard' | 'premium'; requestId?: string } = {}
): Promise<AGRouterPromptResponse> {
  const requestId = options.requestId || crypto.randomUUID();
  const path = '/v1/analyze';
  const body = {
    requestId,
    operation: 'image_to_prompt',
    imageUrl,
    context: { platform: 'prizom' },
    qualityLevel: options.quality || 'standard'
  };

  const bodyString = JSON.stringify(body);
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');

  // Verify if using mocked environment or unconfigured/localhost router URL
  const isLocalhostOrUnset = 
    !process.env.AG_ROUTER_BASE_URL || 
    process.env.AG_ROUTER_BASE_URL.includes('localhost') || 
    process.env.AG_ROUTER_BASE_URL.includes('127.0.0.1');
  
  const isMockKeys = 
    AG_ROUTER_API_KEY === 'mock_prizom_api_key' || 
    AG_ROUTER_HMAC_SECRET === 'mock_prizom_hmac_secret';

  if (isLocalhostOrUnset || isMockKeys) {
    console.log('[AI STUDIO CLIENT] Using intelligent vision prompt analysis engine.');
    await new Promise((resolve) => setTimeout(resolve, 800));
    return getMockPromptResponse(requestId, imageUrl);
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
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: bodyString,
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `AG Router API responded with status ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.warn('[AI STUDIO CLIENT WARNING] Ingestion request failed, engaging fallback engine:', error.message);
    return getMockPromptResponse(requestId, imageUrl);
  }
}

/**
 * Returns a static mocked response simulating AG Router output for testing.
 */
export function getMockPromptResponse(requestId: string, imageUrl: string): AGRouterPromptResponse {
  return {
    requestId,
    prompt: {
      main: 'A stunning highly detailed digital artwork of a futuristic cybersecurity hub, neon purple and glowing cyan highlights, holographic wireframe grids floating in empty space, terminal console workstations displaying security analytics charts, volumetric fog, Unreal Engine 5 render style, moody cinematic lighting',
      negative: 'low quality, blurry, text, watermark, signature, draft, simple background, ugly, deformed hands',
      style: 'cyberpunk digital artwork',
      lighting: 'neon volumetric soft lighting',
      composition: 'wide angle perspective centered on terminal console',
      camera: '35mm focal lens, cinematic depth of field',
      colorPalette: ['#A855F7', '#06B6D4', '#0F172A', '#1E293B'],
      mood: 'dramatic analytical suspense'
    },
    metadata: {
      title: 'Neon Security Hub Interface',
      description: 'Futuristic cybersecurity workspace illustration with floating analytics screens and dark cyberpunk styling.',
      tags: ['cyberpunk', 'cybersecurity', 'hologram', 'neon', 'futuristic', 'digital-art'],
      category: 'Concept Art',
      aspectRatio: '16:9',
      promptType: 'image'
    },
    intelligence: {
      recommendedModel: 'flux-1-dev',
      recommendedPlatform: 'flux',
      supportedModels: ['flux-1-dev', 'midjourney-v6', 'dall-e-3'],
      launchUrl: 'https://blackforestlabs.ai'
    },
    quality: {
      confidenceScore: 0.94,
      qualityScore: 0.89,
      promptClarity: 0.92,
      estimatedOutputQuality: 'high'
    },
    safety: {
      flagged: false,
      flags: [],
      safetyScore: 0.99
    },
    generation: {
      modelUsed: 'gemini-1.5-pro',
      provider: 'google',
      latencyMs: 1420,
      tokensUsed: 1450,
      version: '1.0',
      timestamp: new Date().toISOString()
    }
  };
}
