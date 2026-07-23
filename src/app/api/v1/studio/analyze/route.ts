import { NextResponse } from 'next/server';
import { generatePromptFromImage } from '@/lib/ai-studio/client';
import { checkEnterpriseRateLimit, packageEnterpriseApiBundle } from '@/lib/ai-studio/api-platform';

/**
 * Prizom AI Studio Public REST API Endpoint (Phase 9)
 * POST /api/v1/studio/analyze
 * Accepts image URL, returns multi-target compiled prompts, Style DNA, and Optics analysis.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = authHeader.replace(/^Bearer\s+/i, '') || 'demo_guest_key';

    const rateLimit = checkEnterpriseRateLimit(apiKey);

    const body = await req.json().catch(() => ({}));
    const { imageUrl, quality } = body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Bad Request: "imageUrl" parameter is required.' },
        { status: 400, headers: { 'X-RateLimit-Limit': String(rateLimit.limit), 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
      );
    }

    // Execute central AI Studio perception & AST compilation pipeline
    const response = await generatePromptFromImage(imageUrl, { quality: quality || 'premium' });

    // Package into unified Enterprise API Bundle
    const bundle = packageEnterpriseApiBundle(imageUrl, response);

    return NextResponse.json(
      {
        success: true,
        bundle,
        rateLimit
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetSeconds),
          'X-Prizom-Version': '2.0-enterprise'
        }
      }
    );
  } catch (err: any) {
    console.error('[STUDIO REST API ERROR]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
