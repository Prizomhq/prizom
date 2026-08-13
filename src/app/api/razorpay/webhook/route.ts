import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 400 });
      }

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
      const packageId = payment.notes?.package_id || 'topup_pack';
      const creditsFromNotes = Number(payment.notes?.credits);

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

      if ((type === 'pack_purchase' || type === 'top_up' || creditsFromNotes > 0) && userId) {
        const { topUpCreditsAtomic } = await import('@/lib/ai-studio/credits');
        const amountPaise = Number(payment.amount) || 0;
        const amountInr = Math.round(amountPaise / 100);

        const creditsToGrant = creditsFromNotes || (
          amountInr >= 599 ? 200 :
          amountInr >= 249 ? 75 :
          amountInr >= 99 ? 25 : 10
        );

        await topUpCreditsAtomic(
          userId,
          creditsToGrant,
          paymentId,
          packageId,
          adminSupabase
        );
      }
    }

    return NextResponse.json({ received: true, event });
  } catch (err: any) {
    console.error('[Razorpay Webhook Error]:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

