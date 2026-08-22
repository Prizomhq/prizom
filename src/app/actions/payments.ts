'use server';

import crypto from 'crypto';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { razorpayClient } from '@/lib/razorpay';
import { SERVER_CREDIT_PACKAGES, CreditPackageDefinition } from '@/lib/payments/config';

export type { CreditPackageDefinition };

export interface CreateOrderParams {
  packageId?: string; // Required for pack_purchase
  amount?: number;    // Used for tip (validated server-side)
  currency?: string;
  type: 'subscription' | 'tip' | 'pack_purchase' | 'top_up';
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
    let finalAmountInr = 0;
    let creditsGranted = 0;
    let packageId = params.packageId || 'custom';

    // 1. Server-side Package & Amount Resolution
    if (params.type === 'pack_purchase' || params.type === 'top_up') {
      const selectedPkg = params.packageId ? SERVER_CREDIT_PACKAGES[params.packageId] : null;
      if (!selectedPkg) {
        return { success: false, error: 'Invalid or missing credit package selection.' };
      }
      finalAmountInr = selectedPkg.priceInr;
      creditsGranted = selectedPkg.credits;
      packageId = selectedPkg.id;
    } else if (params.type === 'tip') {
      if (!params.creatorId) {
        return { success: false, error: 'Creator ID is required for tipping.' };
      }
      if (params.creatorId === user.id) {
        return { success: false, error: 'Self-tipping is strictly prohibited.' };
      }
      const tipAmount = Math.floor(Number(params.amount) || 0);
      if (tipAmount < 10 || tipAmount > 10000) {
        return { success: false, error: 'Tip amount must be between ₹10 and ₹10,000 INR.' };
      }
      finalAmountInr = tipAmount;
    } else if (params.type === 'subscription') {
      finalAmountInr = 999;
    } else {
      return { success: false, error: 'Invalid payment transaction type.' };
    }

    const amountInPaise = Math.round(finalAmountInr * 100);

    // 2. Create Order via Razorpay SDK
    const orderOptions = {
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: user.id,
        type: params.type,
        package_id: packageId,
        credits: creditsGranted,
        creator_id: params.creatorId || '',
      },
    };

    const razorpayOrder = await razorpayClient.orders.create(orderOptions);

    // 3. Store Pending Transaction in DB
    const adminSupabase = await createAdminClient();
    const { error: dbError } = await adminSupabase
      .from('transactions')
      .insert({
        user_id: user.id,
        creator_id: params.creatorId || null,
        type: params.type,
        amount: finalAmountInr,
        currency,
        status: 'pending',
        razorpay_order_id: razorpayOrder.id,
        metadata: {
          package_id: packageId,
          credits: creditsGranted,
          ...params.metadata,
        },
      });

    if (dbError) {
      console.error('[Payments] Failed to record pending transaction:', dbError);
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

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || secret === 'placeholder_secret') {
      console.error('[Payments Critical]: RAZORPAY_KEY_SECRET is missing or placeholder!');
      return { success: false, error: 'Razorpay payment verification is temporarily unavailable.' };
    }

    // Timing-safe HMAC signature verification
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf8'),
      Buffer.from(razorpay_signature, 'utf8')
    );

    if (!signatureValid) {
      return { success: false, error: 'Payment signature verification failed' };
    }

    const adminSupabase = await createAdminClient();

    // Fetch existing pending transaction & verify ownership
    const { data: transaction, error: txErr } = await adminSupabase
      .from('transactions')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (txErr || !transaction) {
      return { success: false, error: 'Transaction record not found' };
    }

    if (transaction.user_id !== user.id) {
      return { success: false, error: 'Unauthorized payment verification attempt' };
    }

    if (transaction.status === 'completed') {
      return {
        success: true,
        message: 'Payment already verified',
        alreadyProcessed: true,
        transactionType: transaction.type,
      };
    }

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

    // Business Logic Handlers
    let newBalance: number | undefined;
    let creditsGranted: number | undefined;

    if (transaction.type === 'pack_purchase' || transaction.type === 'top_up') {
      const { topUpCreditsAtomic } = await import('@/lib/ai-studio/credits');
      
      const pkgId = transaction.metadata?.package_id;
      const pkg = pkgId ? SERVER_CREDIT_PACKAGES[pkgId] : null;
      creditsGranted = pkg ? pkg.credits : (Number(transaction.metadata?.credits) || 10);

      const topUpRes = await topUpCreditsAtomic(
        user.id,
        creditsGranted,
        razorpay_payment_id,
        pkgId || 'topup_pack',
        adminSupabase
      );

      newBalance = topUpRes.balanceAfter;
    } else if (transaction.type === 'tip' && transaction.creator_id) {
      // Execute creator tip RPC
      const { data: rpcData, error: rpcError } = await adminSupabase.rpc('process_creator_tip_atomic', {
        p_tipper_id: user.id,
        p_creator_id: transaction.creator_id,
        p_gross_amount: transaction.amount,
        p_razorpay_payment_id: razorpay_payment_id,
        p_razorpay_order_id: razorpay_order_id,
      });

      if (rpcError) {
        console.error('[Payments] Tip RPC processing error:', rpcError);
      }

      // Create in-app notification for creator
      await adminSupabase.from('notifications').insert({
        user_id: transaction.creator_id,
        actor_id: user.id,
        type: 'system',
        content: `❤️ You received a ₹${transaction.amount} creator tip!`,
      });
    } else if (transaction.type === 'subscription') {
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

    return {
      success: true,
      message: 'Payment verified successfully!',
      transactionType: transaction.type,
      creditsGranted,
      newBalance,
    };
  } catch (err: any) {
    console.error('[Payments] Razorpay Signature Verification Error:', err);
    return { success: false, error: err.message || 'Signature verification failed' };
  }
}
