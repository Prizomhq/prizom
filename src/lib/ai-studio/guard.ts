import { createClient } from '@/lib/supabase/server';

export interface AiStudioAccessResult {
  allowed: boolean;
  isPublic: boolean;
  isSuperAdmin: boolean;
  reason?: 'public' | 'super_admin' | 'private_beta' | 'unauthenticated';
}

/**
 * Checks whether AI Studio is configured to be public for everyone.
 * Controlled strictly by environment flag: AI_STUDIO_PUBLIC=true
 * Defaults to FALSE (Private Access Mode).
 */
export function isAiStudioPublic(): boolean {
  const flag = process.env.AI_STUDIO_PUBLIC || process.env.NEXT_PUBLIC_AI_STUDIO_PUBLIC;
  return flag === 'true' || flag === '1';
}

/**
 * Server-side feature gate & authorization check for AI Studio.
 * - When AI_STUDIO_PUBLIC=true: Public access enabled for everyone.
 * - When AI_STUDIO_PUBLIC=false: ONLY Super Admin (role === 'super_admin') has access.
 * Securely queries public.profiles database table (ignoring mutable client user_metadata).
 */
export async function verifyAiStudioAccessServer(): Promise<AiStudioAccessResult> {
  const isPublic = isAiStudioPublic();
  if (isPublic) {
    return { allowed: true, isPublic: true, isSuperAdmin: false, reason: 'public' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { allowed: false, isPublic: false, isSuperAdmin: false, reason: 'unauthenticated' };
    }

    // Fetch user profile role authoritatively from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'super_admin') {
      return { allowed: true, isPublic: false, isSuperAdmin: true, reason: 'super_admin' };
    }

    return { allowed: false, isPublic: false, isSuperAdmin: false, reason: 'private_beta' };
  } catch (err) {
    console.error('[AI STUDIO GUARD ERROR]', err);
    return { allowed: false, isPublic: false, isSuperAdmin: false, reason: 'private_beta' };
  }
}

