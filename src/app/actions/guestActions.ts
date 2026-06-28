'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getClientIpHash } from './interactions';

export async function trackGuestEvent(
  eventType: 'page_view' | 'prompt_view' | 'copy' | 'search' | 'signup_click' | 'signup',
  metadata: { pagePath?: string; promptId?: string; searchQuery?: string; userId?: string } = {}
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const ipHash = await getClientIpHash();
    const adminClient = await createAdminClient();

    const { error } = await adminClient
      .from('guest_events')
      .insert({
        ip_hash: ipHash,
        event_type: eventType,
        page_path: metadata.pagePath || null,
        prompt_id: metadata.promptId || null,
        search_query: metadata.searchQuery || null,
        user_id: metadata.userId || user?.id || null
      });

    if (error) {
      console.error('[GUEST EVENT ERROR] Failed to insert event:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[GUEST EVENT EXCEPTION] Unexpected error:', err);
    return { success: false, error: err.message };
  }
}

export async function getGuestAnalytics() {
  const supabase = await createClient();

  try {
    // 1. Fetch Funnel stats
    const { data: funnelData, error: funnelError } = await supabase
      .from('guest_funnel_stats')
      .select('*')
      .maybeSingle();

    if (funnelError) throw funnelError;

    // 2. Fetch Retention stats
    const { data: retentionData, error: retError } = await supabase
      .from('guest_retention_stats')
      .select('*')
      .maybeSingle();

    if (retError) throw retError;

    // 3. Fetch Entry pages
    const { data: entryPages, error: entryError } = await supabase
      .from('guest_entry_pages')
      .select('page_path, entry_count')
      .order('entry_count', { ascending: false })
      .limit(5);

    if (entryError) throw entryError;

    // Default fallbacks if empty
    const visitors = funnelData?.total_visitors || 0;
    const signups = funnelData?.total_signups || 0;
    const copyUsers = funnelData?.copy_users || 0;
    const copySignups = funnelData?.copy_signups || 0;
    const searchUsers = funnelData?.search_users || 0;
    const searchSignups = funnelData?.search_signups || 0;

    const returningGuests = retentionData?.returning_guests || 0;
    const totalGuests = retentionData?.total_guests || 0;

    return {
      success: true,
      analytics: {
        visitors,
        signups,
        conversionRate: visitors > 0 ? Math.round((signups / visitors) * 100) : 0,
        copyConversionRate: copyUsers > 0 ? Math.round((copySignups / copyUsers) * 100) : 0,
        searchConversionRate: searchUsers > 0 ? Math.round((searchSignups / searchUsers) * 100) : 0,
        retentionRate: totalGuests > 0 ? Math.round((returningGuests / totalGuests) * 100) : 0,
        entryPages: (entryPages || []).map((ep: any) => ({
          page: ep.page_path,
          count: ep.entry_count
        }))
      }
    };
  } catch (err: any) {
    console.error('Error compiling guest experience analytics:', err);
    return {
      success: false,
      error: err.message,
      analytics: {
        visitors: 0,
        signups: 0,
        conversionRate: 0,
        copyConversionRate: 0,
        searchConversionRate: 0,
        retentionRate: 0,
        entryPages: []
      }
    };
  }
}
