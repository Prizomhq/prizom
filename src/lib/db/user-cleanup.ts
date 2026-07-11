import { createAdminClient } from '@/lib/supabase/server';
import { deleteCloudinaryAsset } from '@/lib/cloudinary';

export async function safePermanentDelete(userId: string): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = await createAdminClient();

  // 1. Fetch user's profile and prompts for Cloudinary media cleanups
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();

  const { data: prompts } = await adminSupabase
    .from('prompts')
    .select('image_url')
    .eq('user_id', userId);

  // 2. Cloudinary assets purge
  try {
    if (profile?.avatar_url) {
      await deleteCloudinaryAsset(profile.avatar_url);
    }
    if (prompts) {
      for (const p of prompts) {
        if (p.image_url) {
          await deleteCloudinaryAsset(p.image_url);
        }
      }
    }
  } catch (cloudinaryErr) {
    console.error(`[CLOUDINARY PURGE ERROR] Failed to delete assets for user ${userId}:`, cloudinaryErr);
  }

  // 3. Database cascade deletion (ordered to prevent foreign key errors)
  await adminSupabase.from('notifications').delete().or(`user_id.eq.${userId},actor_id.eq.${userId}`);
  await adminSupabase.from('followers').delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);
  await adminSupabase.from('saved_prompts').delete().eq('user_id', userId);
  await adminSupabase.from('likes').delete().eq('user_id', userId);
  await adminSupabase.from('comments').delete().eq('user_id', userId);
  await adminSupabase.from('user_reports').delete().or(`reporter_id.eq.${userId},reported_id.eq.${userId}`);
  await adminSupabase.from('prompt_reports').delete().eq('reporter_id', userId);
  await adminSupabase.from('prompt_appeals').delete().eq('user_id', userId);
  await adminSupabase.from('prompt_views').delete().eq('user_id', userId);
  await adminSupabase.from('prompt_copy_logs').delete().eq('copier_id', userId);
  await adminSupabase.from('prompts').delete().eq('user_id', userId);
  await adminSupabase.from('profiles').delete().eq('id', userId);

  // 4. Delete Auth User
  const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);
  if (authDeleteError) {
    throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
  }

  // 5. Log in moderation logs
  await adminSupabase
    .from('moderation_logs')
    .insert([{
      moderator_email: 'system@prizom.com',
      action: 'ACCOUNT_DELETED_PERMANENT',
      target_id: userId,
      reason: 'Safe permanent delete executed successfully.'
    }]);

  return { success: true };
}
