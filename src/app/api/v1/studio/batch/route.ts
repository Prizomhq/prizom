import { NextRequest, NextResponse } from 'next/server';
import { checkEnterpriseRateLimit } from '@/lib/ai-studio/api-platform';

export async function POST(req: NextRequest) {
  try {
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

    // In a real implementation, this would push to a Redis/RabbitMQ queue
    // For now, we simulate the async kickoff
    console.log(`[Batch Job ${jobId}] Queued ${images.length} images for processing. Webhook: ${webhookUrl}`);

    return NextResponse.json({
      success: true,
      jobId,
      message: `Batch job queued. You will receive a POST request at ${webhookUrl} when complete.`,
      rateLimit
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
