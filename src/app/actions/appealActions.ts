'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitPromptAppealAction(promptId: string, reason: string) {
  if (!reason || !reason.trim()) {
    return { success: false, error: 'Appeal reason is required.' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // 1. Rate Limiting Check
    try {
      const { rateLimit } = await import('@/lib/rateLimit');
      const { getClientIpHash } = await import('./interactions');
      const ipHash = await getClientIpHash();

      const ipLimit = await rateLimit(ipHash, 'appeal_ip', 5, 60 * 60 * 1000);
      if (!ipLimit.success) {
        return { success: false, error: 'Rate limit exceeded: Too many appeals from this IP address. Please try again later.' };
      }

      const userLimit = await rateLimit(user.id, 'appeal_user', 3, 60 * 60 * 1000);
      if (!userLimit.success) {
        return { success: false, error: 'Rate limit exceeded: You can submit at most 3 appeals per hour.' };
      }
    } catch (limitErr) {
      console.warn('Rate limiter check failed to execute:', limitErr);
    }

    // Check if prompt exists and belongs to the user
    const { data: prompt } = await supabase
      .from('prompts')
      .select('id, user_id, title')
      .eq('id', promptId)
      .single();

    if (!prompt) return { success: false, error: 'Prompt not found.' };
    if (prompt.user_id !== user.id) return { success: false, error: 'Unauthorized to appeal this prompt.' };

    // Insert appeal
    const { error } = await supabase
      .from('prompt_appeals')
      .insert([
        {
          prompt_id: promptId,
          user_id: user.id,
          reason: reason.trim()
        }
      ]);

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, error: 'An appeal has already been submitted for this prompt.' };
      }
      return { success: false, error: error.message };
    }

    // 2. Log in moderation_logs in database
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    
    const email = user.email || ((profile?.username || 'creator') + '@prizom.com');

    const adminClient = await import('@/lib/supabase/server').then(m => m.createAdminClient());
    await adminClient
      .from('moderation_logs')
      .insert([{
        moderator_email: email,
        action: 'PROMPT_APPEAL_SUBMITTED',
        target_id: promptId,
        reason: `Submitted prompt appeal: ${reason.substring(0, 100)}...`
      }]);

    // 3. Send Appeal Received email via centralized service
    try {
      const { dispatchEmail } = await import('@/lib/emailService');
      await dispatchEmail(email, 'appeal_received', {
        username: profile?.username || 'Creator',
        appealReason: reason.trim()
      });
    } catch (emailErr) {
      console.error('Failed to send appeal received email:', emailErr);
    }

    revalidatePath(`/creator/${profile?.username || ''}`, 'layout');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
