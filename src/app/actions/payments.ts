'use server';

import crypto from 'crypto';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { razorpayClient } from '@/lib/razorpay';

export interface CreateOrderParams {
  amount: number; // In INR (e.g. 999 for ₹999)
  currency?: string;
  type: 'subscription' | 'tip' | 'pack_purchase';
  creatorId?: string;
  metadata?: Record<string, any>;
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const currency = params.currency || 'INR';
    const amountInPaise = Math.round(params.amount * 100); // Razorpay requires amount in smallest currency sub-unit

    // Create Razorpay Order via SDK
    const orderOptions = {
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: user.id,
        type: params.type,
        creator_id: params.creatorId || '',
        ...params.metadata,
      },
    };

    const razorpayOrder = await razorpayClient.orders.create(orderOptions);

    // Save pending transaction record in database
    const adminSupabase = await createAdminClient();
    const { error: dbError } = await adminSupabase
      .from('transactions')
      .insert({
        user_id: user.id,
        creator_id: params.creatorId || null,
        type: params.type,
        amount: params.amount,
        currency,
        status: 'pending',
        razorpay_order_id: razorpayOrder.id,
        metadata: params.metadata || {},
      });

    if (dbError) {
      console.error('[Payments] Failed to save pending transaction:', dbError);
    }

    return {
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      },
    };
  } catch (err: any) {
    console.error('[Payments] Razorpay Order Creation Error:', err);
    return { success: false, error: err.message || 'Failed to create payment order' };
  }
}

export async function verifyRazorpayPayment(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return { success: false, error: 'Payment signature verification failed' };
    }

    const adminSupabase = await createAdminClient();

    // Fetch existing pending transaction
    const { data: transaction } = await adminSupabase
      .from('transactions')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    // Update transaction to completed
    await adminSupabase
      .from('transactions')
      .update({
        status: 'completed',
        razorpay_payment_id,
        razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id);

    // If subscription or pro purchase, activate Creator Pro on profile
    if (transaction?.type === 'subscription') {
      await adminSupabase
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', user.id);

      await adminSupabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: 'creator_pro',
          status: 'active',
          razorpay_subscription_id: razorpay_payment_id,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
    }

    // If pack_purchase or top_up, grant AI Studio credits atomically & idempotently
    let newBalance: number | undefined;
    let creditsGranted: number | undefined;

    if (transaction?.type === 'pack_purchase' || transaction?.type === 'top_up') {
      const { topUpCreditsAtomic } = await import('@/lib/ai-studio/credits');
      
      // Package mapping: metadata credits > amount-based calculation (1 credit per ₹4 approx)
      creditsGranted = Number(transaction.metadata?.credits) || (
        transaction.amount >= 599 ? 200 :
        transaction.amount >= 249 ? 75 :
        transaction.amount >= 99 ? 25 : 10
      );

      const topUpRes = await topUpCreditsAtomic(
        user.id,
        creditsGranted,
        razorpay_payment_id,
        transaction.metadata?.package_id || 'topup_pack',
        adminSupabase
      );

      newBalance = topUpRes.balanceAfter;
    }

    return {
      success: true,
      message: 'Payment verified successfully!',
      transactionType: transaction?.type || 'payment',
      creditsGranted,
      newBalance
    };
  } catch (err: any) {

    console.error('[Payments] Razorpay Signature Verification Error:', err);
    return { success: false, error: err.message || 'Signature verification failed' };
  }
}
