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
