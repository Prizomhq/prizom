import { NextRequest, NextResponse } from 'next/server';
import { checkEnterpriseRateLimit } from '@/lib/ai-studio/api-platform';
import { verifyAiStudioAccessServer } from '@/lib/ai-studio/guard';

export async function POST(req: NextRequest) {
  try {
    const access = await verifyAiStudioAccessServer();
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: 'Prizom AI Studio API is currently in private beta testing.' },
        { status: 403 }
      );
    }

    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    const rateLimit = checkEnterpriseRateLimit(apiKey);

    if (rateLimit.tier === 'free') {
      return NextResponse.json({
        success: false,
        error: 'Batch processing requires a Pro or Enterprise API key.'
      }, { status: 403 });
    }

    const body = await req.json();
    const { images, webhookUrl } = body;

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payload: "images" array is required.'
      }, { status: 400 });
    }

    if (!webhookUrl) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payload: "webhookUrl" is required for async batch processing.'
      }, { status: 400 });
    }

    // Acknowledge the batch job immediately
    const jobId = 'batch_' + Math.random().toString(36).substring(2, 15);

    console.log(`[Batch Job ${jobId}] Queued ${images.length} images for processing. Webhook: ${webhookUrl}`);

    // Asynchronously execute batch worker in background
    (async () => {
      try {
        const { generatePromptFromImage } = await import('@/lib/ai-studio/client');
        const { packageEnterpriseApiBundle } = await import('@/lib/ai-studio/api-platform');

        const results = [];
        for (const imgUrl of images.slice(0, 20)) { // Bounded max 20 images per batch
          try {
            const response = await generatePromptFromImage(imgUrl, { quality: 'premium' });
            const bundle = packageEnterpriseApiBundle(imgUrl, response);
            results.push(bundle);
          } catch (err: any) {
            results.push({ sourceImage: imgUrl, error: err.message || 'Processing failed' });
          }
        }

        // Dispatch completed results to webhookUrl
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Prizom-Job-ID': jobId },
          body: JSON.stringify({ jobId, status: 'completed', total: images.length, results }),
          signal: AbortSignal.timeout(10000)
        }).catch((err) => console.warn(`[Batch Job ${jobId}] Webhook dispatch warning:`, err.message));
      } catch (err) {
        console.error(`[Batch Job ${jobId}] Exception in background worker:`, err);
      }
    })();

    return NextResponse.json({
      success: true,
      jobId,
      message: `Batch job ${jobId} queued. Results will be dispatched to ${webhookUrl} when complete.`,
      rateLimit
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

