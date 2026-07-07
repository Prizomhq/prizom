'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { dispatchEmail } from '@/lib/emailService';

const ENABLE_PAID_AI_MODERATION = false; // TODO: Enable AWS Rekognition AI moderation when scale justifies the cost

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const username = formData.get('username') as string;
  const fullName = formData.get('fullName') as string;
  const bio = formData.get('bio') as string;
  const avatarFile = formData.get('avatar') as File | null;

  // Enforce username constraints (3-20 chars, lowercase, numbers, underscores)
  if (username) {
    const cleanedUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(cleanedUsername)) {
      return { 
        success: false, 
        error: 'Username must be 3-20 characters long and can only contain lowercase letters, numbers, and underscores.' 
      };
    }
  }

  try {
    let avatarUrl = undefined;
    let oldAvatarUrl: string | null = null;

    // Upload new avatar if provided
    if (avatarFile && avatarFile.size > 0) {
      // 1. File size check (5MB max for avatars)
      const maxAvatarSize = 5 * 1024 * 1024;
      if (avatarFile.size > maxAvatarSize) {
        return { success: false, error: 'Avatar image must be less than 5MB.' };
      }

      // 2. File type check (JPG, PNG, WebP)
      const validAvatarTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validAvatarTypes.includes(avatarFile.type)) {
        return { success: false, error: 'Invalid avatar format. Only JPG, PNG, and WebP are allowed.' };
      }

      // Fetch the current avatar_url to delete it later if update succeeds
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (currentProfile?.avatar_url) {
        oldAvatarUrl = currentProfile.avatar_url;
      }

      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Dynamically load and configure cloudinary to prevent client-side Webpack bundling leaks
      const { v2: cloudinary } = require('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });

      const uploadOptions: any = {
        folder: 'prizom/avatars',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'center', quality: 'auto', fetch_format: 'auto' }
        ]
      };

      if (ENABLE_PAID_AI_MODERATION) {
        uploadOptions.moderation = 'aws_rek';
      }

      // Upload to Cloudinary avatars folder with face-crop & WebP optimization
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error: any, result: any) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      // Cloudinary NSFW AI Moderation Audit
      if (ENABLE_PAID_AI_MODERATION) {
        const moderation = uploadResult.moderation;
        if (moderation && moderation.length > 0) {
          const isRejected = moderation.some((mod: any) => mod.status === 'rejected');
          if (isRejected) {
            // Clean up flagged upload immediately
            await cloudinary.uploader.destroy(uploadResult.public_id);
            return { success: false, error: 'This upload violates community guidelines.' };
          }
        }
      }
        
      avatarUrl = uploadResult.secure_url;
    }

    // Update profile record
    const updates: any = { bio };
    if (username) updates.username = username;
    if (fullName !== null) updates.full_name = fullName;
    if (avatarUrl) updates.avatar_url = avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      // Handle unique constraint violation for username
      if (error.code === '23505') {
        return { success: false, error: 'Username is already taken' };
      }
      throw error;
    }

    // If update succeeded and a new avatar was uploaded, delete the old one from Cloudinary
    if (avatarUrl && oldAvatarUrl) {
      try {
        const { deleteCloudinaryAsset } = await import('@/lib/cloudinary');
        await deleteCloudinaryAsset(oldAvatarUrl);
      } catch (delErr) {
        console.warn('[CLOUDINARY CLEANUP WARN] Failed to delete old avatar:', delErr);
      }
    }


    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

// P0-1: Fetch active categories from the database (used by OnboardingWizard)
export async function getActiveCategoriesAction(): Promise<{ id: string; name: string; description?: string }[]> {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description')
      .eq('approved', true)
      .eq('show_on_explore', true)
      .order('order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[getActiveCategoriesAction] Failed to fetch categories:', err);
    return [];
  }
}

// P0-1: Fetch active AI tools from the database (used by OnboardingWizard)
export async function getActiveToolsAction(): Promise<{ id: string; name: string }[]> {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('ai_tools')
      .select('id, name')
      .eq('approved', true)
      .order('order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[getActiveToolsAction] Failed to fetch AI tools:', err);
    return [];
  }
}

// P0-2: Accept weighted maps (Record<string, number>) instead of plain string arrays
export async function saveOnboardingInterestsAction(
  toolWeights: Record<string, number>,
  categoryWeights: Record<string, number>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('badges, interests')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    const currentBadges = profile?.badges || [];
    const updatedBadges = currentBadges.includes('onboarded')
      ? currentBadges
      : [...currentBadges, 'onboarded'];

    // Safely merge categories and tools into existing user interests
    const currentInterests = (profile?.interests as Record<string, any>) || {};
    const interests = {
      categories: categoryWeights,
      tools: toolWeights,
      aspectRatios: currentInterests.aspectRatios || {},
      tags: currentInterests.tags || {},
      creators: currentInterests.creators || {},
      searches: currentInterests.searches || []
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        interests,
        badges: updatedBadges
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving onboarding interests:', error);
    return { success: false, error: error.message || 'Failed to save onboarding interests' };
  }
}

export async function deactivateAccountAction(reason: string, feedback?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_deactivated: true,
        deactivated_at: new Date().toISOString(),
        deactivation_reason: reason,
        deactivation_feedback: feedback || null
      })
      .eq('id', user.id);

    if (error) throw error;

    // Sync Auth metadata
    const adminSupabase = await createAdminClient();
    await adminSupabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, is_deactivated: true }
    });

    // Send deactivation email
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    try {
      await dispatchEmail(user.email!, 'account_deactivated', {
        username: profile?.username || 'Creator'
      });
    } catch (emailErr) {
      console.error('Failed to send deactivation email:', emailErr);
    }

    // Sign out to clear session cookies
    await supabase.auth.signOut();

    return { success: true };
  } catch (err: any) {
    console.error('Error deactivating account:', err);
    return { success: false, error: err.message || 'Failed to deactivate account.' };
  }
}

export async function reactivateAccountAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_deactivated: false,
        deactivated_at: null,
        deactivation_reason: null,
        deactivation_feedback: null
      })
      .eq('id', user.id);

    if (error) throw error;

    // Sync Auth metadata
    const adminSupabase = await createAdminClient();
    await adminSupabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, is_deactivated: false }
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('Error reactivating account:', err);
    return { success: false, error: err.message || 'Failed to reactivate account.' };
  }
}

export async function requestAccountDeletionAction(password: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    // Re-authenticate user by signing in again with password
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password
    });

    if (authError) {
      return { success: false, error: 'Incorrect password confirmation.' };
    }

    const scheduledDeletionAt = new Date();
    scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 15);

    const { error } = await supabase
      .from('profiles')
      .update({
        is_deactivated: true,
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
        scheduled_deletion_at: scheduledDeletionAt.toISOString(),
        deletion_reason: reason
      })
      .eq('id', user.id);

    if (error) throw error;

    // Sync Auth metadata
    const adminSupabase = await createAdminClient();
    await adminSupabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, is_deactivated: true, pending_deletion: true }
    });

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    try {
      await dispatchEmail(user.email!, 'account_deletion_requested', {
        username: profile?.username || 'Creator'
      });
    } catch (emailErr) {
      console.error('Failed to send deletion confirmation email:', emailErr);
    }

    // Sign out to clear sessions
    await supabase.auth.signOut();

    return { success: true };
  } catch (err: any) {
    console.error('Error requesting account deletion:', err);
    return { success: false, error: err.message || 'Failed to request account deletion.' };
  }
}

export async function cancelAccountDeletionAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Authentication required.' };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_deactivated: false,
        pending_deletion: false,
        deletion_requested_at: null,
        scheduled_deletion_at: null,
        deletion_reason: null
      })
      .eq('id', user.id);

    if (error) throw error;

    // Sync Auth metadata
    const adminSupabase = await createAdminClient();
    await adminSupabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, is_deactivated: false, pending_deletion: false }
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('Error canceling account deletion:', err);
    return { success: false, error: err.message || 'Failed to cancel account deletion.' };
  }
}
