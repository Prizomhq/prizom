'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { triggerNotification } from './notifications';

export interface EarlyAccessApplication {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  createdAt: string;
  updatedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

/**
 * Submit an Early Access application for AI Studio.
 * Prevents duplicate submissions per user account.
 */
export async function submitEarlyAccessApplicationAction(reason?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required. Please log in to apply.' };
  }

  try {
    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .single();

    // 2. Check for duplicate application
    const { data: existing } = await supabase
      .from('ai_studio_early_access')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return { 
        success: false, 
        error: 'You have already submitted an Early Access application.',
        status: existing.status as 'pending' | 'approved' | 'rejected' | 'revoked'
      };
    }

    // 3. Insert application record
    const fullName = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'Creator';
    const cleanReason = reason ? reason.trim().slice(0, 1000) : null;

    const { data, error } = await supabase
      .from('ai_studio_early_access')
      .insert([{
        user_id: user.id,
        email: user.email!,
        full_name: fullName,
        reason: cleanReason,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('[EARLY ACCESS SUBMIT ERROR]', error);
      return { success: false, error: 'Failed to submit application. Please try again.' };
    }

    // 4. Trigger confirmation notification to creator
    await triggerNotification(
      user.id,
      null,
      'achievement',
      data.id,
      'Your AI Studio Early Access application has been received! We will notify you once approved.'
    );

    revalidatePath('/studio');
    return { success: true, status: 'pending', application: data };
  } catch (err: any) {
    console.error('[EARLY ACCESS ACTION EXCEPTION]', err);
    return { success: false, error: err.message || 'Internal server error' };
  }
}

/**
 * Get current user's Early Access application record.
 */
export async function getUserEarlyAccessStatusAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthenticated' };
  }

  try {
    const { data: record, error } = await supabase
      .from('ai_studio_early_access')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      if (
        error.code === 'PGRST205' || 
        error.code === '42P01' || 
        error.message?.includes('schema cache') || 
        error.message?.includes('does not exist')
      ) {
        return { success: true, record: null };
      }
      throw error;
    }

    return { success: true, record };
  } catch (err: any) {
    console.error('[EARLY ACCESS GET STATUS ERROR]', err);
    return { success: false, error: err.message };
  }
}

/**
 * Admin Action: Fetch list of Early Access applications with optional status filter & search.
 */
export async function adminGetEarlyAccessApplicationsAction(statusFilter?: string, searchQuery?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Admin authorization check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin', 'moderator'].includes(profile.role)) {
    return { success: false, error: 'Forbidden: Admin access required.' };
  }

  try {
    let query = supabase
      .from('ai_studio_early_access')
      .select('*, profiles!ai_studio_early_access_user_id_fkey(username, avatar_url)')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = `%${searchQuery.trim().toLowerCase()}%`;
      query = query.or(`email.ilike.${q},full_name.ilike.${q},reason.ilike.${q}`);
    }

    const { data, error } = await query;

    if (error) {
      if (
        error.code === 'PGRST205' || 
        error.code === '42P01' || 
        error.message?.includes('schema cache') || 
        error.message?.includes('does not exist')
      ) {
        return { 
          success: false, 
          error: "Database table 'public.ai_studio_early_access' is not initialized in Supabase. Please execute 'supabase/40_ai_studio_early_access.sql' in the Supabase SQL Editor." 
        };
      }
      throw error;
    }

    const applications: EarlyAccessApplication[] = (data || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      email: item.email,
      fullName: item.full_name,
      username: item.profiles?.username || null,
      avatarUrl: item.profiles?.avatar_url || null,
      reason: item.reason,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at
    }));

    return { success: true, applications };
  } catch (err: any) {
    console.error('[ADMIN GET EARLY ACCESS APPLICATIONS ERROR]', err);
    return { success: false, error: err.message };
  }
}

/**
 * Admin Action: Approve, Reject, or Revoke Early Access for a user.
 */
export async function adminUpdateEarlyAccessStatusAction(
  applicationId: string,
  newStatus: 'approved' | 'rejected' | 'revoked'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Admin authorization check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin', 'moderator'].includes(profile.role)) {
    return { success: false, error: 'Forbidden: Admin access required.' };
  }

  try {
    // 1. Fetch current application
    const { data: appRecord } = await supabase
      .from('ai_studio_early_access')
      .select('id, user_id, email, status')
      .eq('id', applicationId)
      .single();

    if (!appRecord) {
      return { success: false, error: 'Application not found.' };
    }

    // 2. Update status
    const { data: updated, error } = await supabase
      .from('ai_studio_early_access')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    // 3. Send Notification to User based on status
    let notificationText = '';
    if (newStatus === 'approved') {
      notificationText = '🎉 Congratulations! Your Early Access application for Prizom AI Studio has been approved! Launch AI Studio now from the navigation header.';
    } else if (newStatus === 'rejected') {
      notificationText = 'Update on your AI Studio Early Access request: Access is currently restricted during early rollout, but standard release will be available soon.';
    } else if (newStatus === 'revoked') {
      notificationText = 'Notice: Your early access permission to AI Studio has been updated by administration.';
    }

    if (notificationText) {
      await triggerNotification(
        appRecord.user_id,
        user.id,
        'achievement',
        applicationId,
        notificationText
      );
    }

    revalidatePath('/admin/early-access');
    revalidatePath('/studio');
    return { success: true, updated };
  } catch (err: any) {
    console.error('[ADMIN UPDATE EARLY ACCESS STATUS ERROR]', err);
    return { success: false, error: err.message };
  }
}
