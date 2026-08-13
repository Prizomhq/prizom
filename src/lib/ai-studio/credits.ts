import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Retrieves the current credit balance of a user.
 * Initializes their account with 10 free credits if it doesn't exist yet.
 */
export async function getUserCreditBalance(
  userId: string,
  customClient?: any
): Promise<number> {
  const supabase = customClient || (await createClient());

  const { data, error } = await supabase
    .from('ai_credit_balances')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[CREDITS UTILS ERROR] Failed to fetch credit balance:', error.message);
    throw error;
  }

  // If no balance row exists, initialize it to the default (10)
  if (!data) {
    const adminClient = await createAdminClient();
    const { data: insertData, error: insertError } = await adminClient
      .from('ai_credit_balances')
      .insert({ user_id: userId, balance: 10 })
      .select('balance')
      .single();

    if (insertError) {
      console.warn('[CREDITS UTILS WARN] Failed to auto-initialize balance:', insertError.message);
      return 10; // Fallback default
    }
    return insertData.balance;
  }

  return data.balance;
}

/**
 * Deducts credits atomically using the database function.
 */
export async function deductCreditsAtomic(
  userId: string,
  amount: number,
  reason: string,
  sessionId: string | null = null,
  customClient?: any
): Promise<{ success: boolean; balanceAfter: number; error: string | null }> {
  // Use admin client to execute security-restricted transaction RPC if custom client is not provided
  const supabase = customClient || (await createAdminClient());

  const { data, error } = await supabase.rpc('deduct_studio_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_session_id: sessionId
  });

  if (error) {
    console.error('[CREDITS UTILS ERROR] deduct_studio_credits RPC exception:', error.message);
    return { success: false, balanceAfter: 0, error: error.message };
  }

  if (data && data.length > 0) {
    const result = data[0];
    return {
      success: result.success,
      balanceAfter: result.balance_after,
      error: result.error_msg
    };
  }

  return { success: false, balanceAfter: 0, error: 'Empty RPC result' };
}

/**
 * Refunds credits atomically using the database function.
 */
export async function refundCreditsAtomic(
  userId: string,
  amount: number,
  reason: string,
  sessionId: string | null = null,
  customClient?: any
): Promise<{ success: boolean; balanceAfter: number }> {
  const supabase = customClient || (await createAdminClient());

  const { data, error } = await supabase.rpc('refund_studio_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_session_id: sessionId
  });

  if (error) {
    console.error('[CREDITS UTILS ERROR] refund_studio_credits RPC exception:', error.message);
    throw error;
  }

  if (data && data.length > 0) {
    const result = data[0];
    return {
      success: result.success,
      balanceAfter: result.balance_after
    };
  }

  throw new Error('Refund execution returned an empty RPC result');
}

/**
 * Grants +5 bonus credits if 24 hours have passed since last daily claim.
 */
export async function claimDailyCredits(
  userId: string,
  customClient?: any
): Promise<{ success: boolean; balanceAfter: number; error?: string }> {
  const supabase = customClient || (await createAdminClient());

  // Check last daily claim in ledger
  const { data: lastClaim } = await supabase
    .from('ai_credit_ledger')
    .select('created_at')
    .eq('user_id', userId)
    .eq('reason', 'daily_claim')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastClaim) {
    const lastClaimTime = new Date(lastClaim.created_at).getTime();
    const hoursSince = (Date.now() - lastClaimTime) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      const remainingHours = Math.ceil(24 - hoursSince);
      return {
        success: false,
        balanceAfter: 0,
        error: `Daily credits already claimed today. Please try again in ${remainingHours} hour(s).`
      };
    }
  }

  const result = await refundCreditsAtomic(userId, 5, 'daily_claim', null, supabase);
  return {
    success: true,
    balanceAfter: result.balanceAfter
  };
}

/**
 * Credits top-up function that grants purchased credits atomically.
 * Guarantees IDEMPOTENCY by checking if razorpayPaymentId was already recorded in ai_credit_ledger.
 */
export async function topUpCreditsAtomic(
  userId: string,
  amount: number,
  razorpayPaymentId: string,
  packageId: string = 'credit_topup',
  customClient?: any
): Promise<{ success: boolean; balanceAfter: number; alreadyProcessed?: boolean }> {
  const supabase = customClient || (await createAdminClient());

  // Idempotency check: inspect ai_credit_ledger for reason 'topup_purchase' and razorpayPaymentId
  const { data: existingEntries } = await supabase
    .from('ai_credit_ledger')
    .select('balance_after, id, metadata')
    .eq('user_id', userId)
    .eq('reason', 'topup_purchase');

  if (existingEntries && existingEntries.length > 0) {
    const existing = existingEntries.find((entry: any) => 
      entry.metadata?.razorpay_payment_id === razorpayPaymentId
    );
    if (existing) {
      console.log('[CREDITS TOPUP IDEMPOTENCY] Payment already credited for payment ID:', razorpayPaymentId);
      return {
        success: true,
        balanceAfter: existing.balance_after,
        alreadyProcessed: true
      };
    }
  }

  // Fetch current balance or default to 10
  const currentBalance = await getUserCreditBalance(userId, supabase);
  const newBalance = currentBalance + amount;

  // Update credit balance
  const { error: balErr } = await supabase
    .from('ai_credit_balances')
    .upsert({
      user_id: userId,
      balance: newBalance,
      updated_at: new Date().toISOString()
    });

  if (balErr) {
    console.error('[CREDITS TOPUP ERROR] Failed to update credit balance:', balErr.message);
    throw balErr;
  }

  // Record ledger transaction
  const ledgerPayload: any = {
    user_id: userId,
    delta: amount,
    reason: 'topup_purchase',
    balance_after: newBalance,
    metadata: {
      package_id: packageId,
      razorpay_payment_id: razorpayPaymentId,
      credited_at: new Date().toISOString()
    }
  };

  const { error: ledgerErr } = await supabase
    .from('ai_credit_ledger')
    .insert([ledgerPayload]);

  if (ledgerErr) {
    console.warn('[CREDITS TOPUP WARN] Ledger insert notice:', ledgerErr.message);
    // Retry without metadata field if remote table lacks column
    if (ledgerErr.message && ledgerErr.message.includes('metadata')) {
      delete ledgerPayload.metadata;
      await supabase.from('ai_credit_ledger').insert([ledgerPayload]);
    }
  }

  return {
    success: true,
    balanceAfter: newBalance
  };
}


