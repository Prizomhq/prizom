import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { SERVER_CREDIT_PACKAGES } from '@/lib/payments/config';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // MANDATORY WEBHOOK SECRET CHECK — Security Blocker Fix
    if (!webhookSecret) {
      console.error('[Razorpay Webhook Error]: RAZORPAY_WEBHOOK_SECRET is not configured!');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 400 });
    }

    // Timing-Safe HMAC Signature Verification
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );

    if (!signatureValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const adminSupabase = await createAdminClient();

    // Event 1: payment.captured or order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload.payload?.payment?.entity || {};
      const orderId = payment.order_id;
      const paymentId = payment.id;
      const notes = payment.notes || {};
      const userId = notes.user_id;
      const type = notes.type;
      const packageId = notes.package_id;
      const creatorId = notes.creator_id;

      // 1. Fetch transaction record if available
      let transaction: any = null;
      if (orderId) {
        const { data: existingTx } = await adminSupabase
          .from('transactions')
          .select('*')
          .eq('razorpay_order_id', orderId)
          .maybeSingle();
        transaction = existingTx;

        // Update transaction status to completed
        await adminSupabase
          .from('transactions')
          .update({
            status: 'completed',
            razorpay_payment_id: paymentId,
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', orderId);
      }

      const effectiveUserId = userId || transaction?.user_id;
      const effectiveType = type || transaction?.type;

      // 2. AI Credit Top-Up Handler
      if ((effectiveType === 'pack_purchase' || effectiveType === 'top_up') && effectiveUserId) {
        const { topUpCreditsAtomic } = await import('@/lib/ai-studio/credits');
        const effPackageId = packageId || transaction?.metadata?.package_id;
        const pkg = effPackageId ? SERVER_CREDIT_PACKAGES[effPackageId] : null;
        const creditsToGrant = pkg ? pkg.credits : (Number(notes.credits) || 10);

        await topUpCreditsAtomic(
          effectiveUserId,
          creditsToGrant,
          paymentId,
          effPackageId || 'topup_pack',
          adminSupabase
        );
      }

      // 3. Creator Tip Handler
      const effectiveCreatorId = creatorId || transaction?.creator_id;
      if (effectiveType === 'tip' && effectiveCreatorId && effectiveUserId) {
        const grossAmount = Math.round((Number(payment.amount) || 0) / 100) || transaction?.amount || 0;
        
        if (grossAmount > 0 && effectiveUserId !== effectiveCreatorId) {
          await adminSupabase.rpc('process_creator_tip_atomic', {
            p_tipper_id: effectiveUserId,
            p_creator_id: effectiveCreatorId,
            p_gross_amount: grossAmount,
            p_razorpay_payment_id: paymentId,
            p_razorpay_order_id: orderId || null,
          });

          // Insert Notification
          await adminSupabase.from('notifications').insert({
            user_id: effectiveCreatorId,
            actor_id: effectiveUserId,
            type: 'system',
            content: `❤️ You received a ₹${grossAmount} creator tip!`,
          });
        }
      }

      // 4. Pro Subscription Handler
      if (effectiveType === 'subscription' && effectiveUserId) {
        await adminSupabase
          .from('profiles')
          .update({ is_pro: true })
          .eq('id', effectiveUserId);
      }
    } 
    // Event 2: payment.failed
    else if (event === 'payment.failed') {
      const payment = payload.payload?.payment?.entity || {};
      const orderId = payment.order_id;
      if (orderId) {
        await adminSupabase
          .from('transactions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', orderId);
      }
    } 
    // Event 3: refund.processed / refund.created
    else if (event === 'refund.processed' || event === 'refund.created') {
      const refund = payload.payload?.refund?.entity || {};
      const paymentId = refund.payment_id;
      if (paymentId) {
        await adminSupabase
          .from('transactions')
          .update({
            status: 'refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_payment_id', paymentId);
      }
    } 
    // Event 4: payment.dispute.created
    else if (event === 'payment.dispute.created') {
      const dispute = payload.payload?.dispute?.entity || {};
      const paymentId = dispute.payment_id;
      if (paymentId) {
        await adminSupabase
          .from('transactions')
          .update({
            status: 'disputed',
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_payment_id', paymentId);
      }
    }

    return NextResponse.json({ received: true, event });
  } catch (err: any) {
    console.error('[Razorpay Webhook Error]:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
