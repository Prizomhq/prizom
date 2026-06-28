'use server';

import { createClient } from '@/lib/supabase/server';
import { getPublicCMS } from './adminActions';

export async function getNewCreatorsAction(limit = 12) {
  const supabase = await createClient();

  try {
    const { bannedUsers } = await getPublicCMS();
    const { data: { user } } = await supabase.auth.getUser();

    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = ['super_admin', 'admin', 'moderator'].includes(profile?.role || '');
    }

    // Query profiles sorted by created_at desc
    let query = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, follower_count, badges, created_at')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query
        .not('role', 'in', '(suspended,banned,permanently_banned,disabled)')
        .eq('is_deactivated', false)
        .eq('pending_deletion', false);
    } else {
      query = query.neq('role', 'banned');
    }

    // Exclude banned users and the current logged-in user
    const excludeIds = new Set<string>();
    if (bannedUsers && bannedUsers.length > 0) {
      bannedUsers.forEach((id: string) => excludeIds.add(id));
    }
    if (user) {
      excludeIds.add(user.id);
    }

    if (excludeIds.size > 0) {
      query = query.not('id', 'in', `(${Array.from(excludeIds).join(',')})`);
    }

    const { data: creators, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching new creators:', error);
      return { success: false, error: error.message };
    }

    return { success: true, creators: creators || [] };
  } catch (err: any) {
    console.error('Exception fetching new creators:', err);
    return { success: false, error: err.message };
  }
}
