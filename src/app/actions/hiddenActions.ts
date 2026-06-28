'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Toggle a prompt inside a user's private system-managed "Hidden Prompts" collection.
 */
export async function hidePromptUser(promptId: string, shouldHide: boolean) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("Authentication required");
  }

  const user = session.user;

  try {
    // Perform Toggle in user_hidden_prompts table
    if (shouldHide) {
      // Insert safely, catch unique violations
      const { error: insertErr } = await supabase
        .from('user_hidden_prompts')
        .insert([{
          prompt_id: promptId,
          user_id: user.id
        }]);

      if (insertErr && insertErr.code !== '23505') {
        throw insertErr;
      }
    } else {
      const { error: deleteErr } = await supabase
        .from('user_hidden_prompts')
        .delete()
        .match({
          prompt_id: promptId,
          user_id: user.id
        });

      if (deleteErr) throw deleteErr;
    }

    // Revalidate all caches to ensure immediate platform-wide updates
    revalidatePath('/');
    revalidatePath('/discover');
    revalidatePath('/trending');
    revalidatePath(`/prompt/${promptId}`);
    revalidatePath('/profile');
    revalidatePath('/profile/hidden');

    // Fetch creator's username to revalidate their profile page
    try {
      const { data: promptData } = await supabase
        .from('prompts')
        .select('user_id')
        .eq('id', promptId)
        .single();

      if (promptData?.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', promptData.user_id)
          .single();
        
        if (profileData?.username) {
          revalidatePath(`/creator/${profileData.username}`);
        }
      }
    } catch (e) {
      console.error('Error revalidating creator profile page:', e);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error toggling user-hidden prompt:', err);
    return { success: false, error: err.message || 'Failed to hide prompt.' };
  }
}

/**
 * Fetch the array of prompt IDs hidden by the currently logged-in user.
 */
export async function getUserHiddenPromptIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const { data: saved, error: savedError } = await supabase
      .from('user_hidden_prompts')
      .select('prompt_id')
      .eq('user_id', user.id);

    if (savedError || !saved) return [];

    return saved.map((s: any) => s.prompt_id);
  } catch (err) {
    console.error('Error fetching user hidden prompt IDs:', err);
    return [];
  }
}

/**
 * Fetch the complete combined list of hidden prompt IDs for the current request context.
 * Reads user database hidden prompts (if logged in) and merges with guest hidden prompts cookie.
 */
export async function getEffectiveHiddenPromptIds(): Promise<string[]> {
  const ids = new Set<string>();

  // 1. Fetch guest hidden prompts from request cookies
  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get('prizom_hidden_prompts')?.value;
    if (cookieVal) {
      const parsed = JSON.parse(cookieVal);
      if (Array.isArray(parsed)) {
        parsed.forEach(id => ids.add(id));
      }
    }
  } catch (e) {
    console.error('Error parsing guest hidden prompts cookie:', e);
  }

  // 2. Fetch authenticated user hidden prompts from Supabase DB
  const userHiddenIds = await getUserHiddenPromptIds();
  userHiddenIds.forEach(id => ids.add(id));

  return Array.from(ids);
}
