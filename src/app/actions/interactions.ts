'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { triggerNotification } from './notifications';
import { triggerAchievementCheck } from './achievements';
import { assertNotSuspendedOrBanned } from './moderation';
import { evaluateCreatorVerificationStanding } from './adminActions';
import { rateLimit } from '@/lib/rateLimit';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function toggleLike(promptId: string, currentIsLiked: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await assertNotSuspendedOrBanned(user.id);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  // Rate limit: 60 like actions per minute per user, 120 per minute per IP
  const ipHash = await getClientIpHash();
  const userLimit = await rateLimit(user.id, 'like', 60, 60 * 1000);
  if (!userLimit.success) {
    return { success: false, error: 'Too many like actions. Please slow down.' };
  }
  const ipLimitRes = await rateLimit(ipHash, 'like', 120, 60 * 1000);
  if (!ipLimitRes.success) {
    return { success: false, error: 'Too many like actions. Please slow down.' };
  }

  try {
    // 1. Fetch prompt details to check for block relationship, likes count, and creator username
    const { data: prompt, error: promptErr } = await supabase
      .from('prompts')
      .select('user_id, title, likes_count, profiles!user_id(username)')
      .eq('id', promptId)
      .single();

    if (promptErr || !prompt) {
      return { success: false, error: 'Prompt not found' };
    }

    // 2. Bidirectional block check
    const { checkBlockStatus } = await import('./moderation');
    const { anyBlock } = await checkBlockStatus(prompt.user_id);
    if (anyBlock) {
      return { success: false, error: 'Interaction blocked due to safety settings.' };
    }

    if (currentIsLiked) {
      // Unlike safely
      const { data, error } = await supabase
        .from('likes')
        .delete()
        .match({ user_id: user.id, prompt_id: promptId })
        .select();
        
      if (error) throw error;
        
      if (data && data.length > 0) {
        // Decrement counter is handled automatically by database trigger
      }
    } else {
      // Like safely - insert directly and catch unique violation
      const { data, error } = await supabase
        .from('likes')
        .insert([{ user_id: user.id, prompt_id: promptId }])
        .select();
        
      if (error) {
        // 23505 is unique violation in Postgres
        if (error.code === '23505') {
          return { success: true };
        }
        throw error;
      }
      
      if (data && data.length > 0) {
        // Trigger Notification and Achievement check for prompt owner (increment handled by trigger)
        if (prompt.user_id !== user.id) {
          await triggerNotification(
            prompt.user_id,
            user.id,
            'like',
            promptId,
            `liked your prompt "${prompt.title}"`
          );
          await triggerAchievementCheck(prompt.user_id, 'like');
        }
      }
    }

    revalidatePath(`/prompt/${promptId}`);
    revalidatePath('/discover');
    revalidatePath('/');
    revalidatePath('/trending');
    revalidatePath('/profile');
    const creatorUsername = (prompt?.profiles as any)?.username;
    if (creatorUsername) {
      revalidatePath(`/creator/${creatorUsername}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Error toggling like:', error);
    return { success: false, error: 'Failed to toggle like' };
  }
}

export async function createCollection(name: string, description?: string, isPrivate: boolean = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await assertNotSuspendedOrBanned(user.id);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  // Rate limit: 10 collections per hour per user
  const userLimit = await rateLimit(user.id, 'create_collection', 10, 60 * 60 * 1000);
  if (!userLimit.success) {
    return { success: false, error: 'Collection creation limit reached. Try again later.' };
  }

  try {
    // Note: description column is omitted since it does not exist on the collections table
    const { data, error } = await supabase
      .from('collections')
      .insert([{ user_id: user.id, name, is_private: isPrivate }])
      .select()
      .single();
      
    if (error) throw error;
    revalidatePath('/profile');
    return { success: true, collection: data };
  } catch (error) {
    console.error('Error creating collection:', error);
    return { success: false, error: 'Failed to create collection' };
  }
}

export async function togglePromptInCollection(promptId: string, collectionId: string, shouldSave: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await assertNotSuspendedOrBanned(user.id);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  // Rate limit: 100 save/unsave actions per minute per user
  const userLimit = await rateLimit(user.id, 'save_prompt', 100, 60 * 1000);
  if (!userLimit.success) {
    return { success: false, error: 'Too many save actions. Please slow down.' };
  }

  try {
    const { data: prompt, error: promptErr } = await supabase
      .from('prompts')
      .select('user_id, title, saves_count, profiles!user_id(username)')
      .eq('id', promptId)
      .single();

    if (promptErr || !prompt) {
      return { success: false, error: 'Prompt not found' };
    }

    // Bidirectional block check
    const { checkBlockStatus } = await import('./moderation');
    const { anyBlock } = await checkBlockStatus(prompt.user_id);
    if (anyBlock) {
      return { success: false, error: 'Interaction blocked due to safety settings.' };
    }

    if (!shouldSave) {
      await supabase
        .from('saved_prompts')
        .delete()
        .match({ collection_id: collectionId, prompt_id: promptId, user_id: user.id });
    } else {
      await supabase
        .from('saved_prompts')
        .insert([{ collection_id: collectionId, prompt_id: promptId, user_id: user.id }]);
        
      // Trigger Notification and Achievement check for prompt owner (increment handled by trigger)
      if (prompt.user_id !== user.id) {
        await triggerNotification(
          prompt.user_id,
          user.id,
          'save',
          promptId,
          `saved your prompt "${prompt.title}" to their collections`
        );
        await triggerAchievementCheck(prompt.user_id, 'save');
      }
    }

    revalidatePath(`/prompt/${promptId}`);
    revalidatePath('/profile');
    revalidatePath('/');
    revalidatePath('/discover');
    revalidatePath('/trending');
    const creatorUsername = (prompt?.profiles as any)?.username;
    if (creatorUsername) {
      revalidatePath(`/creator/${creatorUsername}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Error toggling prompt in collection:', error);
    return { success: false, error: 'Failed to update collection' };
  }
}

export async function removePromptFromAllCollections(promptId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await assertNotSuspendedOrBanned(user.id);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  try {
    // Get count of collections this user has saved this prompt to
    const { data: userSaves } = await supabase
      .from('saved_prompts')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('user_id', user.id);

    const saveCountToRemove = userSaves?.length || 0;

    if (saveCountToRemove > 0) {
      const { error } = await supabase
        .from('saved_prompts')
        .delete()
        .match({ prompt_id: promptId, user_id: user.id });

      if (error) throw error;
    }

    // Fetch creator's username to revalidate their profile page
    const { data: prompt } = await supabase
      .from('prompts')
      .select('profiles!user_id(username)')
      .eq('id', promptId)
      .single();
    const creatorUsername = (prompt?.profiles as any)?.username;

    revalidatePath(`/prompt/${promptId}`);
    revalidatePath('/profile');
    revalidatePath('/');
    revalidatePath('/discover');
    revalidatePath('/trending');
    if (creatorUsername) {
      revalidatePath(`/creator/${creatorUsername}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Error removing prompt from collections:', error);
    return { success: false, error: 'Failed to remove from collections' };
  }
}

export async function getUserCollections(promptId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: collections } = await supabase
    .from('collections')
    .select('*, saved_prompts(prompt_id, prompts(image_url))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!collections) return [];

  if (promptId) {
    const { data: savedPrompts } = await supabase
      .from('saved_prompts')
      .select('collection_id')
      .eq('prompt_id', promptId)
      .eq('user_id', user.id);
      
    const savedCollectionIds = new Set(savedPrompts?.map(sp => sp.collection_id) || []);
    
    return collections.map(c => ({
      ...c,
      isSaved: savedCollectionIds.has(c.id)
    }));
  }

  return collections.map(c => ({ ...c, isSaved: false }));
}

export async function checkInteractionStatus(promptId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isLiked: false, isSaved: false };
  }

  const [likeRes, saveRes] = await Promise.all([
    supabase.from('likes').select('id').match({ user_id: user.id, prompt_id: promptId }).limit(1),
    supabase.from('saved_prompts').select('id').match({ user_id: user.id, prompt_id: promptId }).limit(1)
  ]);

  return {
    isLiked: !!likeRes.data && likeRes.data.length > 0,
    isSaved: !!saveRes.data && saveRes.data.length > 0
  };
}

export async function incrementPromptCopyCount(promptId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const copierId = user?.id || null;

  try {
    const adminClient = await createAdminClient();

    // 1. Fetch current prompt's copy count and creator using adminClient
    const { data: prompt, error: promptErr } = await adminClient
      .from('prompts')
      .select('user_id, title, copies_count')
      .eq('id', promptId)
      .single();

    if (promptErr || !prompt) {
      return { success: false, error: 'Prompt not found.' };
    }

    const ipHash = await getClientIpHash();
    const cooldownPeriod = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24h cooldown

    // Check if there is an existing copy event within the cooldown window for this prompt (matching IP or user)
    let checkQuery = adminClient
      .from('prompt_copy_logs')
      .select('id')
      .eq('prompt_id', promptId)
      .gte('copied_at', cooldownPeriod);

    if (copierId) {
      checkQuery = checkQuery.or(`copier_id.eq.${copierId},ip_hash.eq.${ipHash}`);
    } else {
      checkQuery = checkQuery.eq('ip_hash', ipHash);
    }

    const { data: existing, error: checkError } = await checkQuery.limit(1);
    if (checkError) throw checkError;

    const isSpam = existing && existing.length > 0;

    // Server-side Guest Copy Limit enforcement
    if (!copierId) {
      const { data: limitInfo } = await adminClient
        .from('guest_usage_limits')
        .select('copies_today, last_reset')
        .eq('ip_hash', ipHash)
        .maybeSingle();

      if (limitInfo) {
        const lastReset = new Date(limitInfo.last_reset).getTime();
        const isExpired = Date.now() - lastReset > 24 * 60 * 60 * 1000;
        const currentCopies = isExpired ? 0 : (limitInfo.copies_today || 0);
        if (!isSpam && currentCopies >= 5) {
          return { success: false, error: 'Guest copy limit exceeded. Please log in to copy more prompts.' };
        }
      }
    }

    if (!isSpam) {
      // Log copy log to database using adminClient to bypass RLS select/insert privileges
      const { error: logError } = await adminClient
        .from('prompt_copy_logs')
        .insert([{
          prompt_id: promptId,
          copier_id: copierId,
          ip_hash: ipHash
        }]);
      if (logError) throw logError;

      // Track guest experience copy event
      if (!copierId) {
        try {
          const { trackGuestEvent } = await import('./guestActions');
          await trackGuestEvent('copy', { promptId });
        } catch (trackErr) {
          console.error('Failed to log guest copy event:', trackErr);
        }
      }
    }

    // Query trigger-updated copy count from DB
    const { data: updatedPrompt } = await adminClient
      .from('prompts')
      .select('copies_count, user_id')
      .eq('id', promptId)
      .single();

    const newCopiesCount = updatedPrompt?.copies_count || 0;

    // Fetch updated total copies for the creator
    let totalCopies = 0;
    if (updatedPrompt?.user_id) {
      const { data: creatorPrompts } = await adminClient
        .from('prompts')
        .select('id')
        .eq('user_id', updatedPrompt.user_id);
      const creatorPromptIds = creatorPrompts?.map(p => p.id) || [];
      
      if (creatorPromptIds.length > 0) {
        const { count } = await adminClient
          .from('prompt_copy_logs')
          .select('*', { count: 'exact', head: true })
          .in('prompt_id', creatorPromptIds);
        totalCopies = count || 0;
      }

      // Re-evaluate verification standing for the creator
      await evaluateCreatorVerificationStanding(updatedPrompt.user_id);
    }

    // Revalidate Next.js cache paths to clear stale copy count rendering
    revalidatePath(`/prompt/${promptId}`);
    revalidatePath('/');
    revalidatePath('/discover');
    revalidatePath('/trending');
    
    if (prompt?.user_id) {
      const { data: creatorProfile } = await adminClient
        .from('profiles')
        .select('username')
        .eq('id', prompt.user_id)
        .single();
      
      if (creatorProfile?.username) {
        revalidatePath(`/creator/${creatorProfile.username}`);
        revalidatePath(`/creator/${creatorProfile.username}/analytics`);
      }
    }
    revalidatePath('/admin');
    revalidatePath('/admin/users');

    return { success: true, newCopiesCount, totalCopies, cooldownActive: isSpam };
  } catch (error: any) {
    console.error('Error incrementing prompt copy count:', error);
    return { success: false, error: error.message || 'Failed to increment copy count.' };
  }
}

export async function recordPromptViewAction(promptId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;

  try {
    const adminClient = await createAdminClient();
    const ipHash = await getClientIpHash();
    const cooldownPeriod = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24h cooldown

    // Check if there is an existing view within the cooldown window for this prompt (matching IP or user)
    let checkQuery = adminClient
      .from('prompt_views')
      .select('id')
      .eq('prompt_id', promptId)
      .gte('viewed_at', cooldownPeriod);

    if (userId) {
      checkQuery = checkQuery.or(`user_id.eq.${userId},ip_hash.eq.${ipHash}`);
    } else {
      checkQuery = checkQuery.eq('ip_hash', ipHash);
    }

    const { data: existing, error: checkError } = await checkQuery.limit(1);
    if (checkError) throw checkError;

    if (!existing || existing.length === 0) {
      const { error: insertError } = await adminClient
        .from('prompt_views')
        .insert([{
          prompt_id: promptId,
          user_id: userId,
          ip_hash: ipHash
        }]);

      if (insertError) throw insertError;

      // Track guest experience view event
      if (!userId) {
        try {
          const { trackGuestEvent } = await import('./guestActions');
          await trackGuestEvent('prompt_view', { promptId });
        } catch (trackErr) {
          console.error('Failed to log guest prompt_view event:', trackErr);
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error logging prompt view:', error);
    return { success: false, error: error.message || 'Failed to record view.' };
  }
}

export async function getClientIpHash() {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
  // Hashing with SHA-256 for privacy compliance
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export async function deleteCollectionAction(collectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await assertNotSuspendedOrBanned(user.id);
    const { error } = await supabase
      .from('collections')
      .delete()
      .match({ id: collectionId, user_id: user.id });

    if (error) throw error;
    revalidatePath('/profile');
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting collection:', err);
    return { success: false, error: err.message || 'Failed to delete collection.' };
  }
}

export async function toggleCollectionVisibilityAction(collectionId: string, isPrivate: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await assertNotSuspendedOrBanned(user.id);
    const { error } = await supabase
      .from('collections')
      .update({ is_private: isPrivate })
      .match({ id: collectionId, user_id: user.id });

    if (error) throw error;
    revalidatePath('/profile');
    revalidatePath(`/profile/collection/${collectionId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Error updating collection privacy:', err);
    return { success: false, error: err.message || 'Failed to update collection privacy.' };
  }
}

