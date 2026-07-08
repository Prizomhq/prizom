 'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getClientIpHash } from './interactions';

/**
 * Logs a launcher analytics event to the database.
 * Uses the admin client to log events for both registered users and guests.
 */
export async function trackLauncherEvent(
  promptId: string,
  platform: string,
  eventType: 'launch_clicked' | 'launch_success' | 'clipboard_failure' | 'popup_blocked' | 'guide_displayed' | 'guide_completed' | 'guide_skipped'
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    const adminClient = await createAdminClient();

    // 1. Fetch Creator ID from prompt
    const { data: prompt, error: promptErr } = await adminClient
      .from('prompts')
      .select('user_id')
      .eq('id', promptId)
      .single();

    if (promptErr) {
      console.error('[LAUNCHER TRACKING ERROR] Failed to fetch prompt creator:', promptErr.message);
    }
    const creatorId = prompt?.user_id || null;

    // 2. Fetch requester's IP hash
    const ipHash = await getClientIpHash();

    // 3. Log event
    const { error } = await adminClient
      .from('prompt_launch_logs')
      .insert({
        prompt_id: promptId,
        user_id: userId,
        creator_id: creatorId,
        platform,
        event_type: eventType,
        ip_hash: ipHash
      });

    if (error) {
      console.error('[LAUNCHER TRACKING ERROR] Failed to insert event:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[LAUNCHER TRACKING EXCEPTION] Unexpected error:', err);
    return { success: false, error: err.message };
  }
}
