import { createAdminClient } from './supabase/server';

/**
 * P1-1: Atomic rate limiter using PostgreSQL INSERT ... ON CONFLICT DO UPDATE.
 *
 * Replaces the previous read-modify-write (3 round-trips) pattern that was
 * susceptible to race conditions under concurrent requests. A single DB call
 * now handles the entire check-and-increment atomically, preventing bypass
 * via parallel request flooding.
 *
 * Requires the `increment_rate_limit(key, max_hits, window_ms)` PostgreSQL
 * function from migration 14_production_stabilization.sql.
 */
export async function rateLimit(
  identifier: string, // e.g. IP hash or User ID
  action: string,     // e.g. 'login', 'signup', 'report', 'appeal', 'contact'
  limit: number,      // max hits allowed in window
  windowMs: number    // window size in milliseconds
): Promise<{ success: boolean; limit: number; remaining: number; resetAt: Date }> {
  const supabase = await createAdminClient();
  const key = `${identifier}:${action}`;
  const now = new Date();

  try {
    // Single atomic RPC — INSERT ... ON CONFLICT DO UPDATE inside PostgreSQL.
    // No race condition possible: the DB handles concurrency with row-level locking.
    const { data, error } = await supabase.rpc('increment_rate_limit', {
      rate_limit_key: key,
      max_hits: limit,
      window_ms: windowMs
    });

    if (error) {
      console.error('[RATE LIMIT ERROR] RPC failed:', error.message);
      // Fail-open: allow the request through rather than blocking all traffic on DB error
      return { success: true, limit, remaining: limit, resetAt: now };
    }

    const resultList = data as {
      allowed: boolean;
      current_hits: number;
      reset_timestamp: string;
    }[];

    if (!resultList || resultList.length === 0) {
      console.warn('[RATE LIMIT WARNING] Empty response from rate limit RPC.');
      return { success: true, limit, remaining: limit, resetAt: now };
    }

    const result = resultList[0];
    const resetAt = new Date(result.reset_timestamp);
    const remaining = Math.max(0, limit - result.current_hits);

    return {
      success: result.allowed,
      limit,
      remaining,
      resetAt
    };
  } catch (err) {
    console.error('[RATE LIMIT EXCEPTION] Unexpected error:', err);
    // Fail-open: prevent system lockout on unexpected errors
    return { success: true, limit, remaining: limit, resetAt: now };
  }
}
