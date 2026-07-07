'use server';

import { createClient } from '@/lib/supabase/server';
import { assertNotSuspendedOrBanned } from './moderation';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rateLimit';
import { getClientIpHash } from './interactions';

export async function createPromptAction(promptData: {
  title: string;
  prompt_text: string;
  negative_prompt?: string;
  ai_tool: string;
  category: string;
  tags?: string[];
  image_url?: string;
  image_width?: number | null;
  image_height?: number | null;
  aspect_ratio: string;
  remix_of?: string | null;
  remix_notes?: string | null;
  remix_parent_chain?: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  // Validate input constraints
  if (!promptData.title || promptData.title.trim().length < 3 || promptData.title.trim().length > 100) {
    return { success: false, error: 'Title must be between 3 and 100 characters.' };
  }
  if (!promptData.prompt_text || promptData.prompt_text.trim().length < 10 || promptData.prompt_text.trim().length > 5000) {
    return { success: false, error: 'Prompt text must be between 10 and 5000 characters.' };
  }
  if (promptData.tags && promptData.tags.some(t => t.length > 25)) {
    return { success: false, error: 'Tags cannot exceed 25 characters each.' };
  }

  // Check if user is approved (required for invite-only publishing)
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('is_approved, role')
    .eq('id', user.id)
    .single();

  if (profileErr) {
    console.error('Error fetching profile for publishing approval check:', profileErr);
    return { success: false, error: 'Failed to verify account publishing approval.' };
  }

  const isApproved = profile?.is_approved || false;
  const role = profile?.role || 'user';
  const isPrivileged = ['super_admin', 'admin', 'moderator'].includes(role);

  if (!isApproved && !isPrivileged) {
    return { success: false, error: 'Publishing restricted: Your account is not approved yet.' };
  }

  // 1. Rate Limiting checks
  try {
    const ipHash = await getClientIpHash();
    
    // Limit by User ID: 5 creations per hour
    const userLimit = await rateLimit(user.id, 'create_prompt', 5, 60 * 60 * 1000);
    if (!userLimit.success) {
      return { success: false, error: 'Too many prompts created. You are limited to 5 per hour.' };
    }
    
    // Limit by IP hash: 10 creations per hour
    const ipLimit = await rateLimit(ipHash, 'create_prompt', 10, 60 * 60 * 1000);
    if (!ipLimit.success) {
      return { success: false, error: 'Too many prompts created from this IP. You are limited to 10 per hour.' };
    }
  } catch (limitErr) {
    console.warn('Rate limiting check failed to execute on prompt creation:', limitErr);
  }

  try {
    // Assert user is not suspended or permanently banned
    await assertNotSuspendedOrBanned(user.id);

    const promptId = crypto.randomUUID();
    const parentPromptId = promptData.remix_of || null;
    const originalRootId = parentPromptId 
      ? (promptData.remix_parent_chain?.[0] || parentPromptId)
      : promptId;

    const { data, error } = await supabase
      .from('prompts')
      .insert([
        {
          id: promptId,
          user_id: user.id,
          title: promptData.title,
          prompt_text: promptData.prompt_text,
          negative_prompt: promptData.negative_prompt || null,
          ai_tool: promptData.ai_tool,
          category: promptData.category,
          tags: promptData.tags || [],
          image_url: promptData.image_url || null,
          image_width: promptData.image_width || null,
          image_height: promptData.image_height || null,
          aspect_ratio: promptData.aspect_ratio || '1:1',
          remix_of: promptData.remix_of || null,
          remix_notes: promptData.remix_notes || null,
          remix_parent_chain: promptData.remix_parent_chain || [],
          original_root_id: originalRootId,
          parent_prompt_id: parentPromptId
        }
      ])
      .select();

    if (error) throw error;

    revalidatePath('/');
    revalidatePath('/discover');
    revalidatePath('/trending');
    
    return { success: true, data };
  } catch (err: any) {
    console.error('Error creating prompt:', err);
    return { success: false, error: err.message || 'Failed to create prompt.' };
  }
}

export async function getPopularTags() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('prompts')
    .select('tags')
    .eq('moderation_status', 'active')
    .eq('is_hidden', false)
    .order('likes_count', { ascending: false })
    .limit(100);

  if (error || !data) return { success: true, tags: [] };

  const tagCounts: { [key: string]: number } = {};
  data.forEach((p: any) => {
    if (p.tags && Array.isArray(p.tags)) {
      p.tags.forEach((t: string) => {
        const clean = t.trim();
        if (clean) {
          tagCounts[clean] = (tagCounts[clean] || 0) + 1;
        }
      });
    }
  });

  const sortedTags = Object.keys(tagCounts)
    .sort((a, b) => tagCounts[b] - tagCounts[a])
    .slice(0, 30);

  return { success: true, tags: sortedTags };
}

export async function updatePromptAction(
  promptId: string,
  promptData: {
    title: string;
    description?: string | null;
    prompt_text: string;
    negative_prompt?: string | null;
    ai_tool: string;
    category: string;
    tags?: string[];
    image_url?: string | null;
    image_width?: number | null;
    image_height?: number | null;
    aspect_ratio: string;
    is_hidden: boolean;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  // 1. Fetch existing prompt to verify ownership
  const { data: existingPrompt, error: fetchErr } = await supabase
    .from('prompts')
    .select('user_id, image_url')
    .eq('id', promptId)
    .single();

  if (fetchErr || !existingPrompt) {
    return { success: false, error: 'Prompt not found.' };
  }

  // Strict ownership check: only the creator can edit it
  if (existingPrompt.user_id !== user.id) {
    return { success: false, error: 'Forbidden: You do not have permission to edit this prompt.' };
  }

  // 2. Validate input fields
  if (!promptData.title || promptData.title.trim().length < 3 || promptData.title.trim().length > 100) {
    return { success: false, error: 'Title must be between 3 and 100 characters.' };
  }
  if (!promptData.prompt_text || promptData.prompt_text.trim().length < 10 || promptData.prompt_text.trim().length > 5000) {
    return { success: false, error: 'Prompt text must be between 10 and 5000 characters.' };
  }
  if (promptData.tags && promptData.tags.some(t => t.length > 25)) {
    return { success: false, error: 'Tags cannot exceed 25 characters each.' };
  }

  try {
    // Assert user is not suspended or permanently banned
    await assertNotSuspendedOrBanned(user.id);

    // 3. Perform update in database using user client (obeying RLS)
    const { error: updateErr } = await supabase
      .from('prompts')
      .update({
        title: promptData.title.trim(),
        description: promptData.description ? promptData.description.trim() : null,
        prompt_text: promptData.prompt_text.trim(),
        negative_prompt: promptData.negative_prompt ? promptData.negative_prompt.trim() : null,
        ai_tool: promptData.ai_tool,
        category: promptData.category,
        tags: promptData.tags || [],
        image_url: promptData.image_url || null,
        image_width: promptData.image_width || null,
        image_height: promptData.image_height || null,
        aspect_ratio: promptData.aspect_ratio || '1:1',
        is_hidden: promptData.is_hidden,
        updated_at: new Date().toISOString()
      })
      .eq('id', promptId);


    if (updateErr) throw updateErr;

    // 4. Delete old image from Cloudinary if it was replaced or removed
    if (existingPrompt.image_url && existingPrompt.image_url !== promptData.image_url) {
      try {
        const { deleteCloudinaryAsset } = await import('@/lib/cloudinary');
        await deleteCloudinaryAsset(existingPrompt.image_url);
      } catch (delErr) {
        console.warn('[CLOUDINARY CLEANUP WARN] Failed to delete old prompt image:', delErr);
      }
    }

    // 5. Revalidate cache
    revalidatePath('/');
    revalidatePath('/discover');
    revalidatePath('/trending');
    revalidatePath(`/prompt/${promptId}`);

    return { success: true };
  } catch (err: any) {
    console.error('Error updating prompt:', err);
    return { success: false, error: err.message || 'Failed to update prompt.' };
  }
}


