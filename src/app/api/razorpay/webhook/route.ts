import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder_webhook_secret';

    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const adminSupabase = await createAdminClient();

    if (event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;
      const userId = payment.notes?.user_id;
      const type = payment.notes?.type;

      if (orderId) {
        await adminSupabase
          .from('transactions')
          .update({
            status: 'completed',
            razorpay_payment_id: paymentId,
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', orderId);
      }

      if (type === 'subscription' && userId) {
        await adminSupabase
          .from('profiles')
          .update({ is_pro: true })
          .eq('id', userId);
      }
    }

    return NextResponse.json({ received: true, event });
  } catch (err: any) {
    console.error('[Razorpay Webhook Error]:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
