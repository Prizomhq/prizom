import { createClient } from '@/lib/supabase/server';

export type AiStudioAccessReason = 
  | 'public' 
  | 'super_admin' 
  | 'early_access' 
  | 'pending' 
  | 'rejected' 
  | 'revoked' 
  | 'coming_soon' 
  | 'unauthenticated';

export interface AiStudioAccessResult {
  allowed: boolean;
  isPublic: boolean;
  isSuperAdmin: boolean;
  reason: AiStudioAccessReason;
  earlyAccessRecord?: {
    status: 'pending' | 'approved' | 'rejected' | 'revoked';
    createdAt: string;
    reason?: string;
  } | null;
}

/**
 * Checks whether AI Studio is configured to be public for everyone.
 * Controlled strictly by environment flag: AI_STUDIO_PUBLIC=true or AI_STUDIO_MODE=PUBLIC
 * Defaults to FALSE (Gated Early Access Mode).
 */
export function isAiStudioPublic(): boolean {
  const flag = process.env.AI_STUDIO_PUBLIC || process.env.NEXT_PUBLIC_AI_STUDIO_PUBLIC || process.env.AI_STUDIO_MODE;
  return flag === 'true' || flag === '1' || flag?.toUpperCase() === 'PUBLIC';
}

/**
 * Server-side feature gate & authorization check for AI Studio.
 * 1. Super Admin: Always allowed (reason: 'super_admin')
 * 2. Public Flag (AI_STUDIO_PUBLIC=true): Public access enabled (reason: 'public')
 * 3. Early Access Approved: User is approved in ai_studio_early_access table -> allowed (reason: 'early_access')
 * 4. Pending / Rejected / Revoked / None: Disallowed with explicit server reason
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

    // 1. Fetch user profile role authoritatively from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = profile?.role === 'super_admin';
    if (isSuperAdmin) {
      return { allowed: true, isPublic: false, isSuperAdmin: true, reason: 'super_admin' };
    }

    // 2. Fetch Early Access application status from ai_studio_early_access
    const { data: earlyAccess, error: eaError } = await supabase
      .from('ai_studio_early_access')
      .select('status, created_at, reason')
      .eq('user_id', user.id)
      .maybeSingle();

    if (eaError) {
      if (
        eaError.code === 'PGRST205' || 
        eaError.code === '42P01' || 
        eaError.code === '42501' ||
        eaError.message?.includes('schema cache') ||
        eaError.message?.includes('does not exist') ||
        eaError.message?.includes('permission denied')
      ) {
        return { allowed: false, isPublic: false, isSuperAdmin: false, reason: 'coming_soon', earlyAccessRecord: null };
      }
      console.error('[AI STUDIO GUARD EA ERROR]', eaError);
    }

    if (earlyAccess) {
      const eaRecord = {
        status: earlyAccess.status as 'pending' | 'approved' | 'rejected' | 'revoked',
        createdAt: earlyAccess.created_at,
        reason: earlyAccess.reason,
      };

      if (earlyAccess.status === 'approved') {
        return { 
          allowed: true, 
          isPublic: false, 
          isSuperAdmin: false, 
          reason: 'early_access', 
          earlyAccessRecord: eaRecord 
        };
      }

      return { 
        allowed: false, 
        isPublic: false, 
        isSuperAdmin: false, 
        reason: earlyAccess.status as AiStudioAccessReason, 
        earlyAccessRecord: eaRecord 
      };
    }

    return { allowed: false, isPublic: false, isSuperAdmin: false, reason: 'coming_soon', earlyAccessRecord: null };
  } catch (err: any) {
    console.error('[AI STUDIO GUARD ERROR]', err);
    return { allowed: false, isPublic: false, isSuperAdmin: false, reason: 'coming_soon', earlyAccessRecord: null };
  }
}


