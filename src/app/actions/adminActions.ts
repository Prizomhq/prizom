'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import * as store from '@/lib/db/admin-store';
import { triggerNotification } from './notifications';
import { dispatchEmail } from '@/lib/emailService';
import { rateLimit } from '@/lib/rateLimit';
import { getClientIpHash } from './interactions';
import { getGuestAnalytics } from './guestActions';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { safePermanentDelete as dbPermanentDelete } from '@/lib/db/user-cleanup';

// Granular role helpers (Priority 3 & 4)
async function assertModeratorOrAbove() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'user';
  if (!['super_admin', 'admin', 'moderator'].includes(role)) {
    throw new Error('Unauthorized: Moderator clearance required.');
  }

  return { user, role };
}

async function assertAdminOrAbove() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'user';
  if (!['super_admin', 'admin'].includes(role)) {
    throw new Error('Unauthorized: Admin clearance required.');
  }

  return { user, role };
}

async function assertSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'user';
  if (role !== 'super_admin') {
    throw new Error('Unauthorized: Super Admin clearance required.');
  }

  return { user, role };
}

// Deprecated fallback for backward compatibility
const assertAdmin = assertModeratorOrAbove;

// 1. Admin Auth & Self-Healing Bootstrap
export async function authenticateAdmin(email: string) {
  const adminConfig = await store.isEmailAdmin(email);
  if (!adminConfig) {
    return { success: false, error: 'Unauthorized email account. Access denied.' };
  }
  return { success: true, role: adminConfig.role };
}

// Post-auth helper to synchronize roles on profile during login
export async function syncAdminRole() {
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  const userId = user.id;
  const email = user.email || '';

  const adminConfig = await store.isEmailAdmin(email);
  const supabase = await createAdminClient(); // Secure client utilizing service key
  
  if (!adminConfig) {
    // If not in whitelist, check if database still has admin role, and demote them
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (profile && ['super_admin', 'admin', 'moderator'].includes(profile.role)) {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', userId);
      
      if (!error) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { role: 'user' }
        });
        console.log(`[AUTO-SYNC DEMOTE] Demoted user ${email} back to standard 'user' role.`);
      }
      return { success: true, role: 'user' };
    }
    return { success: false, role: 'user' };
  }

  // Set role in profiles table and auth metadata
  const { error } = await supabase
    .from('profiles')
    .update({ role: adminConfig.role })
    .eq('id', userId);

  if (error) {
    console.error('Failed to sync admin profile role:', error);
    const adminConfig = await store.isEmailAdmin(user.email!) || { role: 'user' };
    return { success: true, role: adminConfig.role };
  }

  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role: adminConfig.role }
  });

  return { success: true, role: adminConfig.role };
}

async function revalidateModerationTargets({
  promptId,
  username,
  userId
}: {
  promptId?: string;
  username?: string;
  userId?: string;
}) {
  const supabase = await createAdminClient();
  
  // 1. Revalidate static lists and feeds
  revalidatePath('/');
  revalidatePath('/discover');
  revalidatePath('/search');
  revalidatePath('/trending');
  revalidatePath('/admin/prompts');
  revalidatePath('/admin/users');
  revalidatePath('/admin/messages');
  revalidatePath('/profile');
  
  // 2. Specific prompt details
  if (promptId) {
    revalidatePath(`/prompt/${promptId}`);
    revalidatePath('/prompt/[id]', 'layout');
  }
  
  // 3. User profile and analytics
  let resolvedUsername = username;
  if (userId && !resolvedUsername) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    if (profile) {
      resolvedUsername = profile.username;
    }
  }
  
  if (resolvedUsername) {
    revalidatePath(`/creator/${resolvedUsername}`);
    revalidatePath(`/creator/${resolvedUsername}/analytics`);
  }
  
  // 4. Revalidate all prompts of the creator if userId is provided
  if (userId) {
    const { data: creatorPrompts } = await supabase
      .from('prompts')
      .select('id')
      .eq('user_id', userId);
    if (creatorPrompts) {
      for (const p of creatorPrompts) {
        revalidatePath(`/prompt/${p.id}`);
      }
    }
  }
}

// 2. Admin Analytics
export async function getAdminAnalytics() {
  await assertAdminOrAbove();
  const supabase = await createClient();

  try {
    // Total Users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Active Users (updated in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo);

    // Active prompts (moderation_status = 'active')
    const { count: activeCount } = await supabase
      .from('prompts')
      .select('id, profiles!inner(role)', { count: 'exact', head: true })
      .eq('moderation_status', 'active')
      .not('profiles.role', 'in', '("suspended","banned","permanently_banned")');

    // Removed prompts (moderation_status = 'pending_deletion')
    const { count: removedCount } = await supabase
      .from('prompts')
      .select('id', { count: 'exact', head: true })
      .eq('moderation_status', 'pending_deletion');

    // Archived prompts (archived_prompts table)
    const { count: archivedCount } = await supabase
      .from('archived_prompts')
      .select('*', { count: 'exact', head: true });

    // Deleted prompts (from moderation_logs)
    const { count: deletedCount } = await supabase
      .from('moderation_logs')
      .select('*', { count: 'exact', head: true })
      .in('action', ['PROMPT_DELETED', 'ACCOUNT_DELETED', 'hard_delete_prompt']);

    // Sum metrics of archived prompts to preserve historical totals
    const { data: archivedMetrics } = await supabase
      .from('archived_prompts')
      .select('likes_count, saves_count, copies_count, remix_count');

    let archivedLikes = 0;
    let archivedSaves = 0;
    let archivedCopies = 0;
    let archivedRemixes = 0;

    if (archivedMetrics) {
      archivedMetrics.forEach(p => {
        archivedLikes += p.likes_count || 0;
        archivedSaves += p.saves_count || 0;
        archivedCopies += p.copies_count || 0;
        archivedRemixes += p.remix_count || 0;
      });
    }

    // Active Remixes count
    const { count: activeRemixes } = await supabase
      .from('prompts')
      .select('id, profiles!inner(role)', { count: 'exact', head: true })
      .not('remix_of', 'is', null)
      .eq('moderation_status', 'active')
      .not('profiles.role', 'in', '("suspended","banned","permanently_banned")');

    // Active Prompt Likes count
    const { count: activeLikes } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true });

    // Active Prompt Saves count
    const { count: activeSaves } = await supabase
      .from('saved_prompts')
      .select('*', { count: 'exact', head: true });

    // Active Prompt Copies count
    const { data: activeCopiesData } = await supabase
      .from('prompts')
      .select('copies_count')
      .eq('moderation_status', 'active');
    
    let activeCopies = 0;
    if (activeCopiesData) {
      activeCopiesData.forEach(p => {
        activeCopies += p.copies_count || 0;
      });
    }

    const totalLikesCount = (activeLikes || 0) + archivedLikes;
    const totalSavesCount = (activeSaves || 0) + archivedSaves;
    const totalCopiesCount = activeCopies + archivedCopies;
    const totalRemixesCount = (activeRemixes || 0) + archivedRemixes;

    // Prompt reports counts
    const { count: promptReportsCount } = await supabase
      .from('prompt_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // User reports counts
    const { count: userReportsCount } = await supabase
      .from('user_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Fetch trending prompts (top 5 by likes_count)
    const { data: trendingPrompts } = await supabase
      .from('prompts')
      .select('id, title, likes_count, copies_count, user_id, profiles!user_id(username)')
      .eq('moderation_status', 'active')
      .order('likes_count', { ascending: false })
      .limit(5);

    // Recent signups (last 5 profiles)
    const { data: recentSignups } = await supabase
      .from('profiles')
      .select('id, username, full_name, email:id, created_at, role')
      .order('created_at', { ascending: false })
      .limit(5);

    // SAFETY & MODERATION METRICS COMPILING
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Prompt reports frequency
    const { count: promptReportsToday } = await supabase
      .from('prompt_reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    const { count: promptReportsWeekly } = await supabase
      .from('prompt_reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo);

    // User reports frequency
    const { count: userReportsToday } = await supabase
      .from('user_reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    const { count: userReportsWeekly } = await supabase
      .from('user_reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo);

    // Resolved reports
    const { count: resolvedPromptReports } = await supabase
      .from('prompt_reports')
      .select('*', { count: 'exact', head: true })
      .in('status', ['resolved', 'dismissed']);

    const { count: resolvedUserReports } = await supabase
      .from('user_reports')
      .select('*', { count: 'exact', head: true })
      .in('status', ['resolved', 'dismissed']);

    // Hidden prompts (including pending_deletion and prompts owned by suspended/banned users)
    const { count: suspendedUserPromptsCount } = await supabase
      .from('prompts')
      .select('id, profiles!inner(role)', { count: 'exact', head: true })
      .eq('moderation_status', 'active')
      .in('profiles.role', ['suspended', 'banned', 'permanently_banned']);

    const hiddenCount = (removedCount || 0) + (suspendedUserPromptsCount || 0);

    const { count: verifiedCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .contains('badges', '["verified"]');

    // Top reported prompt aggregation
    const { data: promptReportCounts } = await supabase
      .from('prompt_reports')
      .select('prompt_id');
    
    let mostReportedPromptId = null;
    let mostReportedPromptCount = 0;
    if (promptReportCounts && promptReportCounts.length > 0) {
      const counts: Record<string, number> = {};
      promptReportCounts.forEach((r) => {
        if (r.prompt_id) {
          counts[r.prompt_id] = (counts[r.prompt_id] || 0) + 1;
        }
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        mostReportedPromptId = sorted[0][0];
        mostReportedPromptCount = Number(sorted[0][1]);
      }
    }

    let mostReportedPromptTitle = 'None';
    if (mostReportedPromptId) {
      const { data: pData } = await supabase
        .from('prompts')
        .select('title')
        .eq('id', mostReportedPromptId)
        .maybeSingle();
      if (pData) mostReportedPromptTitle = pData.title;
    }

    // Top reported user aggregation
    const { data: userReportCounts } = await supabase
      .from('user_reports')
      .select('reported_id');
    
    let mostReportedUserId = null;
    let mostReportedUserCount = 0;
    if (userReportCounts && userReportCounts.length > 0) {
      const counts: Record<string, number> = {};
      userReportCounts.forEach((r) => {
        if (r.reported_id) {
          counts[r.reported_id] = (counts[r.reported_id] || 0) + 1;
        }
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        mostReportedUserId = sorted[0][0];
        mostReportedUserCount = Number(sorted[0][1]);
      }
    }

    let mostReportedUsername = 'None';
    if (mostReportedUserId) {
      const { data: uData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', mostReportedUserId)
        .maybeSingle();
      if (uData) mostReportedUsername = uData.username;
    }

    // Fetch aspect ratio stats from prompts
    const { data: promptsRatios } = await supabase
      .from('prompts')
      .select('aspect_ratio')
      .eq('moderation_status', 'active');

    const aspectRatiosUsed: Record<string, number> = {};
    let totalRatiosCount = 0;
    if (promptsRatios && promptsRatios.length > 0) {
      promptsRatios.forEach((p: any) => {
        const ratio = p.aspect_ratio || '1:1';
        aspectRatiosUsed[ratio] = (aspectRatiosUsed[ratio] || 0) + 1;
        totalRatiosCount++;
      });
    }

    const topAspectRatios = Object.entries(aspectRatiosUsed).map(([ratio, count]) => {
      const percentage = totalRatiosCount > 0 ? Math.round((count / totalRatiosCount) * 100) : 0;
      return { ratio, count: Number(count), percentage };
    }).sort((a: any, b: any) => b.count - a.count);

    // Query active, removed, and archived prompt counts broken down by category slug
    const { data: categoriesList } = await supabase
      .from('categories')
      .select('id, name, slug');

    const categoryBreakdown: Record<string, { name: string; active: number; removed: number; archived: number }> = {};
    if (categoriesList) {
      categoriesList.forEach(c => {
        categoryBreakdown[c.slug] = { name: c.name, active: 0, removed: 0, archived: 0 };
      });
    }

    // Active prompts by category
    const { data: activePromptsCat } = await supabase
      .from('prompts')
      .select('category')
      .eq('moderation_status', 'active');
    
    if (activePromptsCat) {
      activePromptsCat.forEach((p: any) => {
        if (p.category && categoryBreakdown[p.category]) {
          categoryBreakdown[p.category].active++;
        }
      });
    }

    // Removed prompts by category
    const { data: removedPromptsCat } = await supabase
      .from('prompts')
      .select('category')
      .eq('moderation_status', 'pending_deletion');
    
    if (removedPromptsCat) {
      removedPromptsCat.forEach((p: any) => {
        if (p.category && categoryBreakdown[p.category]) {
          categoryBreakdown[p.category].removed++;
        }
      });
    }

    // Archived prompts by category
    const { data: archivedPromptsCat } = await supabase
      .from('archived_prompts')
      .select('category');

    if (archivedPromptsCat) {
      archivedPromptsCat.forEach((p: any) => {
        if (p.category && categoryBreakdown[p.category]) {
          categoryBreakdown[p.category].archived++;
        }
      });
    }

    // --- SYSTEM HEALTH DATA ---
    // 1. Cron Stats
    const { data: latestCron } = await supabase
      .from('cron_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: failedCron24h } = await supabase
      .from('cron_runs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failure')
      .gte('started_at', oneDayAgo);

    const { data: lastCronSuccess } = await supabase
      .from('cron_runs')
      .select('completed_at')
      .eq('job_name', 'moderation_cleanup')
      .eq('status', 'success')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let cronWarningAlert = null;
    if (lastCronSuccess && lastCronSuccess.completed_at) {
      const lastRunTime = new Date(lastCronSuccess.completed_at).getTime();
      if (Date.now() - lastRunTime > 24 * 60 * 60 * 1000) {
        cronWarningAlert = `Warning: The moderation cleanup cron has not run successfully in the last 24 hours (last execution: ${new Date(lastCronSuccess.completed_at).toLocaleString()}).`;
      }
    } else {
      cronWarningAlert = 'Warning: No successful moderation cleanup cron execution found.';
    }

    // 2. Email Logs Stats
    const { count: totalEmails } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true });

    const { count: sentEmails } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent');

    const { count: failedEmails } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    const { count: pendingEmails } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 3. Security blocked spam
    const { count: blockedSpamCount } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .gte('hits', 3);

    // 4. Guest conversion funnel analytics
    const guestAnalyticsRes = await getGuestAnalytics();
    const guestFunnel = guestAnalyticsRes.success ? guestAnalyticsRes.analytics : {
      visitors: 0,
      signups: 0,
      conversionRate: 0,
      copyConversionRate: 0,
      searchConversionRate: 0,
      retentionRate: 0,
      entryPages: []
    };

    // 5. Open Appeals counts
    const { count: pendingAccountAppeals } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('appeal_status', 'pending');

    const { count: pendingPromptAppeals } = await supabase
      .from('prompt_appeals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    return {
      success: true,
      analytics: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalPrompts: activeCount || 0,
        totalRemixes: totalRemixesCount || 0,
        totalUploads: activeCount || 0,
        reportedPromptsCount: promptReportsCount || 0,
        reportedUsersCount: userReportsCount || 0,
        totalLikes: totalLikesCount || 0,
        totalSaves: totalSavesCount || 0,
        totalCopies: totalCopiesCount || 0,
        
        // Safety extension
        reportsToday: (promptReportsToday || 0) + (userReportsToday || 0),
        reportsWeekly: (promptReportsWeekly || 0) + (userReportsWeekly || 0),
        resolvedReportsCount: (resolvedPromptReports || 0) + (resolvedUserReports || 0),
        hiddenPromptsCount: hiddenCount,
        verifiedCreatorsCount: verifiedCount || 0,
        mostReportedPrompt: {
          id: mostReportedPromptId,
          title: mostReportedPromptTitle,
          count: mostReportedPromptCount
        },
        mostReportedCreator: {
          id: mostReportedUserId,
          username: mostReportedUsername,
          count: mostReportedUserCount
        },

        trendingPrompts: (trendingPrompts || []).map((p) => ({
          id: p.id,
          title: p.title,
          likesCount: p.likes_count,
          copiesCount: p.copies_count,
          creator: (p.profiles as any)?.username || 'unknown'
        })),
        recentSignups: (recentSignups || []).map((u) => ({
          id: u.id,
          username: u.username,
          fullName: u.full_name,
          createdAt: u.created_at,
          role: u.role
        })),
        topAspectRatios,

        // New production hardening categories
        activePromptsCount: activeCount || 0,
        removedPromptsCount: removedCount || 0,
        archivedPromptsCount: archivedCount || 0,
        deletedPromptsCount: deletedCount || 0,
        cronWarningAlert,
        categoryBreakdown,

        // Operational telemetry
        cron: {
          lastJobName: latestCron?.job_name || 'None',
          lastJobStatus: latestCron?.status || 'No runs yet',
          lastJobDuration: latestCron?.duration_ms || 0,
          lastJobProcessed: latestCron?.records_processed || 0,
          lastJobError: latestCron?.error_message || null,
          lastSuccessTime: lastCronSuccess?.completed_at || null,
          failedCount24h: failedCron24h || 0
        },
        emails: {
          total: totalEmails || 0,
          sent: sentEmails || 0,
          failed: failedEmails || 0,
          pending: pendingEmails || 0
        },
        security: {
          blockedSpamCount: blockedSpamCount || 0
        },
        guestFunnel,
        appeals: {
          pendingAccount: pendingAccountAppeals || 0,
          pendingPrompt: pendingPromptAppeals || 0
        }
      }
    };
  } catch (err: any) {
    console.error('Failed to load admin analytics:', err);
    return { success: false, error: err.message };
  }
}

// 3. User Management
export async function getAdminUsersList(searchQuery: string = '') {
  await assertAdminOrAbove();
  const supabase = await createClient();

  let query = supabase
    .from('profiles')
    .select('*, prompt_reports_against:user_reports!user_reports_reported_id_fkey(count)')
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.ilike('username', `%${searchQuery}%`);
  }

  const { data: profiles, error } = await query;
  if (error) return { success: false, error: error.message };

  const formatted = profiles.map((p: any) => {
    const isSuspended = p.role === 'suspended';
    const isBanned = p.role === 'permanently_banned' || p.role === 'banned';
    return {
      id: p.id,
      username: p.username,
      fullName: p.full_name,
      avatarUrl: p.avatar_url,
      bio: p.bio,
      followerCount: p.follower_count,
      followingCount: p.following_count,
      role: p.role,
      badges: p.badges || [],
      createdAt: p.created_at,
      isSuspended,
      isBanned,
      banReason: p.ban_reason || '',
      reportCount: p.prompt_reports_against?.[0]?.count || 0,
      verificationSource: p.verification_source
    };
  });

  return { success: true, users: formatted };
}

export async function getLifecycleUsersAction() {
  await assertAdminOrAbove();
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*, prompt_reports_against:user_reports!user_reports_reported_id_fkey(count)')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };

  const formatted = profiles.map((p: any) => ({
    id: p.id,
    username: p.username,
    fullName: p.full_name,
    avatarUrl: p.avatar_url,
    role: p.role,
    createdAt: p.created_at,
    isDeactivated: p.is_deactivated || false,
    deactivatedAt: p.deactivated_at,
    deactivationReason: p.deactivation_reason,
    deactivationFeedback: p.deactivation_feedback,
    pendingDeletion: p.pending_deletion || false,
    deletionRequestedAt: p.deletion_requested_at,
    scheduledDeletionAt: p.scheduled_deletion_at,
    deletionReason: p.deletion_reason,
    reportCount: p.prompt_reports_against?.[0]?.count || 0
  }));

  return { success: true, users: formatted };
}

export async function adminCancelDeletionAction(userId: string) {
  await assertAdminOrAbove();
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      is_deactivated: false,
      pending_deletion: false,
      deletion_requested_at: null,
      scheduled_deletion_at: null,
      deletion_reason: null
    })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };

  // Sync Auth metadata
  try {
    const { data: { user: targetUser } } = await supabase.auth.admin.getUserById(userId);
    if (targetUser) {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { ...targetUser.user_metadata, is_deactivated: false, pending_deletion: false }
      });
    }
  } catch (metaErr) {
    console.warn('[ADMIN SYNC WARN] Failed to sync auth metadata for cancel deletion:', metaErr);
  }

  // Log action
  const { data: { user } } = await (await createClient()).auth.getUser();
  await supabase
    .from('moderation_logs')
    .insert([{
      moderator_id: user?.id || null,
      moderator_email: user?.email || 'admin@prizom.com',
      action: 'CANCEL_DELETION',
      target_id: userId,
      reason: 'Admin canceled account deletion request.'
    }]);

  return { success: true };
}

export async function adminForceDeletionAction(userId: string): Promise<{ success: boolean; error?: string }> {
  await assertAdminOrAbove();
  
  try {
    return await dbPermanentDelete(userId);
  } catch (err: any) {
    console.error('Failed to force delete user:', err);
    return { success: false, error: err.message || 'Failed to force delete user.' };
  }
}

export async function toggleUserBan(userId: string, reason: string = '', actionType: 'suspended' | 'permanently_banned' | 'active' = 'suspended') {
  const { user: adminUser } = await assertAdminOrAbove();
  const supabase = await createClient();

  // Get user details
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', userId)
    .single();

  if (!profile) return { success: false, error: 'User profile not found' };
  if (profile.role === 'super_admin') {
    return { success: false, error: 'Super Administrators cannot be suspended or banned.' };
  }

  const isCurrentlyBanned = profile.role === 'permanently_banned' || profile.role === 'banned';
  const isCurrentlySuspended = profile.role === 'suspended';
  const isSuspendedOrBanned = isCurrentlyBanned || isCurrentlySuspended;

  const supabaseAdmin = await createAdminClient();
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = authUser?.user?.email || (profile.username + '@prizom.com');

  if (isSuspendedOrBanned || actionType === 'active') {
    // Restore profile role
    await supabaseAdmin
      .from('profiles')
      .update({ 
        role: 'user',
        suspended_at: null,
        warning_sent: false,
        appeal_status: 'none',
        appeal_reason: null,
        appeal_supporting_info: null,
        ban_reason: null
      })
      .eq('id', userId);
    
    // Log to DB moderation_logs
    await supabaseAdmin
      .from('moderation_logs')
      .insert([{
        moderator_id: adminUser.id,
        moderator_email: adminUser.email || 'system@prizom.com',
        action: 'ACCOUNT_RESTORED',
        target_id: userId,
        reason: 'Account restored/unsuspended.'
      }]);
    
    // Send email alert
    await dispatchEmail(email, 'account_reinstated', {
      username: profile.username
    });

    // Notify user
    await triggerNotification(userId, null, 'moderation', null, 'Your account has been fully reinstated by the moderation team.');
  } else {
    if (actionType === 'suspended') {
      await supabaseAdmin
        .from('profiles')
        .update({ 
          role: 'suspended',
          suspended_at: new Date().toISOString(),
          warning_sent: false,
          appeal_status: 'none',
          appeal_reason: null,
          appeal_supporting_info: null,
          ban_reason: reason || 'Community guidelines violation.'
        })
        .eq('id', userId);

      await supabaseAdmin
        .from('moderation_logs')
        .insert([{
          moderator_id: adminUser.id,
          moderator_email: adminUser.email || 'system@prizom.com',
          action: 'ACCOUNT_SUSPENDED',
          target_id: userId,
          reason: reason || 'Suspended for policy violation.'
        }]);
      
      // Send suspension email
      await dispatchEmail(email, 'account_suspended', {
        username: profile.username,
        reason: reason || 'Suspended for policy violation.',
        days: 15
      });

      // Trigger system notifications if possible before kicking
      await triggerNotification(userId, null, 'moderation', null, `Your account was suspended due to: ${reason || 'Guidelines violations'}.`);
    } else {
      // permanently_banned
      await supabaseAdmin
        .from('profiles')
        .update({ 
          role: 'permanently_banned',
          suspended_at: new Date().toISOString(),
          warning_sent: false,
          appeal_status: 'none',
          appeal_reason: null,
          appeal_supporting_info: null,
          ban_reason: reason || 'Severe community guidelines violation.'
        })
        .eq('id', userId);

      await supabaseAdmin
        .from('moderation_logs')
        .insert([{
          moderator_id: adminUser.id,
          moderator_email: adminUser.email || 'system@prizom.com',
          action: 'ACCOUNT_PERMANENTLY_BANNED',
          target_id: userId,
          reason: reason || 'Permanently banned for severe violation.'
        }]);
      
      // Send permanent ban email
      await dispatchEmail(email, 'account_suspended', {
        username: profile.username,
        reason: reason || 'Severe violation of platform guidelines.',
        days: 9999
      });

      // Trigger system notifications
      await triggerNotification(userId, null, 'moderation', null, `Your account was permanently banned.`);
    }
  }

  // Re-evaluate verified creator standing following ban status updates
  await evaluateCreatorVerificationStanding(userId);

  // Revalidate targets
  await revalidateModerationTargets({ userId, username: profile.username });

  return { success: true };
}

export async function submitAppealAction(reason: string, supportingInfo?: string, turnstileToken?: string) {
  // 1. CAPTCHA verification
  const captchaCheck = await verifyTurnstileToken(turnstileToken);
  if (!captchaCheck.success) {
    return { success: false, error: captchaCheck.error || 'CAPTCHA validation failed.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  const ipHash = await getClientIpHash();
  const ipLimit = await rateLimit(ipHash, 'appeal', 5, 60 * 60 * 1000);
  if (!ipLimit.success) {
    return { success: false, error: 'Too many appeals from this IP. Please try again in an hour.' };
  }

  const userLimit = await rateLimit(user.id, 'appeal', 3, 60 * 60 * 1000);
  if (!userLimit.success) {
    return { success: false, error: 'Too many appeals from this account. Please try again in an hour.' };
  }

  // Fetch role
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, role, appeal_status')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'User profile not found' };
  if (profile.role !== 'suspended') {
    return { success: false, error: 'Only suspended users can submit appeals.' };
  }

  if (profile.appeal_status === 'pending') {
    return { success: false, error: 'You already have a pending appeal under review.' };
  }

  // Add appeal info to profiles table
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      appeal_status: 'pending',
      appeal_reason: reason,
      appeal_supporting_info: supportingInfo || null
    })
    .eq('id', user.id);

  if (updateErr) throw updateErr;

  const email = user.email || (profile.username + '@prizom.com');

  // Send Appeal Submitted Email
  await dispatchEmail(email, 'appeal_received', {
    username: profile.username,
    appealReason: reason
  });

  // Log in moderation logs in database
  await supabase
    .from('moderation_logs')
    .insert([{
      moderator_email: email,
      action: 'APPEAL_SUBMITTED',
      target_id: user.id,
      reason: `Submitted appeal: ${reason.substring(0, 100)}...`
    }]);

  return { success: true };
}

export async function resolveAppealAction(appealId: string, action: 'approve' | 'reject') {
  const { user: adminUser } = await assertAdminOrAbove();
  const supabaseAdmin = await createAdminClient();
  
  // Since appealId is the userId (p.id)
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, role, appeal_status')
    .eq('id', appealId)
    .single();

  if (error || !profile) return { success: false, error: 'Appeal not found.' };

  if (profile.appeal_status !== 'pending') {
    return { success: false, error: 'Appeal has already been resolved.' };
  }

  const email = `${profile.username}@prizom.com`;

  if (action === 'approve') {
    // Approve appeal: reinstate account
    await supabaseAdmin
      .from('profiles')
      .update({
        role: 'user',
        appeal_status: 'approved',
        suspended_at: null,
        warning_sent: false,
        appeal_reason: null,
        appeal_supporting_info: null,
        ban_reason: null
      })
      .eq('id', appealId);

    // Send Reinstatement Email
    await dispatchEmail(email, 'account_reinstated', {
      username: profile.username
    });

    // Log moderation actions to DB
    await supabaseAdmin
      .from('moderation_logs')
      .insert([
        {
          moderator_id: adminUser.id,
          moderator_email: adminUser.email || 'system@prizom.com',
          action: 'APPEAL_APPROVED',
          target_id: appealId,
          reason: 'Suspension appeal approved.'
        },
        {
          moderator_id: adminUser.id,
          moderator_email: adminUser.email || 'system@prizom.com',
          action: 'ACCOUNT_RESTORED',
          target_id: appealId,
          reason: 'Account reinstated following approved appeal.'
        }
      ]);
    
    // Notify
    await triggerNotification(appealId, null, 'moderation', null, 'Your appeal was approved and account has been fully reinstated.');

    // Re-evaluate verified creator standing following account reinstatement
    await evaluateCreatorVerificationStanding(appealId);
  } else {
    // Reject appeal
    await supabaseAdmin
      .from('profiles')
      .update({
        appeal_status: 'rejected'
      })
      .eq('id', appealId);

    // Send Rejection Email
    await dispatchEmail(email, 'appeal_rejected', {
      username: profile.username,
      targetName: 'Account Suspension'
    });

    // Log moderation action to DB
    await supabaseAdmin
      .from('moderation_logs')
      .insert([{
        moderator_id: adminUser.id,
        moderator_email: adminUser.email || 'system@prizom.com',
        action: 'APPEAL_REJECTED',
        target_id: appealId,
        reason: 'Suspension appeal rejected.'
      }]);
  }

  await revalidateModerationTargets({ userId: appealId, username: profile.username });

  return { success: true };
}

export async function getAppealsAdmin() {
  await assertAdminOrAbove();
  const supabase = await createClient();

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, suspended_at, appeal_status, appeal_reason, appeal_supporting_info, created_at')
      .eq('role', 'suspended')
      .eq('appeal_status', 'pending');

    if (error) throw error;

    const formatted = (profiles || []).map((p: any) => ({
      id: p.id,
      userId: p.id,
      username: p.username,
      email: `${p.username}@prizom.com`,
      reason: p.appeal_reason || '',
      supportingInfo: p.appeal_supporting_info || '',
      status: p.appeal_status,
      createdAt: p.suspended_at || p.created_at
    }));

    return { success: true, appeals: formatted };
  } catch (err: any) {
    console.error('Error in getAppealsAdmin:', err);
    return { success: false, error: err.message };
  }
}

export async function getPromptAppealsAdmin() {
  await assertAdminOrAbove();
  const supabase = await createClient();

  try {
    const { data: appeals, error } = await supabase
      .from('prompt_appeals')
      .select('*, prompt:prompts(title, image_url), creator:profiles!user_id(username, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (appeals || []).map((app: any) => ({
      id: app.id,
      promptId: app.prompt_id,
      userId: app.user_id,
      reason: app.reason,
      status: app.status,
      createdAt: app.created_at,
      username: app.creator?.username || 'unknown',
      avatarUrl: app.creator?.avatar_url || '',
      email: app.creator?.username ? `${app.creator.username}@prizom.com` : 'creator@prizom.com',
      promptTitle: app.prompt?.title || 'Deleted Prompt',
      promptImageUrl: app.prompt?.image_url || '',
      reviewedBy: app.reviewed_by,
      reviewedAt: app.reviewed_at
    }));

    return { success: true, appeals: formatted };
  } catch (err: any) {
    console.error('Error in getPromptAppealsAdmin:', err);
    return { success: false, error: err.message };
  }
}

export async function resolvePromptAppealAction(appealId: string, action: 'approve' | 'reject') {
  try {
    const { user: adminUser } = await assertAdminOrAbove();
    const supabase = await createClient();

    // 1. Fetch appeal details
    const { data: appeal, error: fetchErr } = await supabase
      .from('prompt_appeals')
      .select('*, prompt:prompts(title, user_id), creator:profiles!user_id(username)')
      .eq('id', appealId)
      .single();

    if (fetchErr || !appeal) {
      return { success: false, error: 'Appeal not found.' };
    }

    if (appeal.status !== 'pending') {
      return { success: false, error: 'Appeal has already been resolved.' };
    }

    const email = appeal.creator?.username ? `${appeal.creator.username}@prizom.com` : 'creator@prizom.com';

    if (action === 'approve') {
      // Check if prompt exists first (not hard-deleted)
      const { data: existingPrompt } = await supabase
        .from('prompts')
        .select('id')
        .eq('id', appeal.prompt_id)
        .maybeSingle();

      if (!existingPrompt) {
        return { success: false, error: 'Prompt has been permanently deleted or does not exist.' };
      }

      // 3. Restore the prompt
      const { error: restoreErr } = await supabase
        .from('prompts')
        .update({
          moderation_status: 'active',
          moderation_reason: null,
          moderated_at: null,
          moderated_by: null,
          warning_sent: false
        })
        .eq('id', appeal.prompt_id);

      if (restoreErr) throw restoreErr;

      // 4. Log to moderation_logs
      await supabase
        .from('moderation_logs')
        .insert([{
          moderator_id: adminUser.id,
          moderator_email: adminUser.email || 'moderator@prizom.com',
          action: 'approve_appeal',
          target_id: appeal.prompt_id,
          reason: `Prompt removal appeal approved. Original violation appeal resolved.`
        }]);

      // 5. Send notifications
      await triggerNotification(
        appeal.user_id,
        null,
        'moderation',
        appeal.prompt_id,
        `Success! Your appeal for prompt "${appeal.prompt?.title || 'your prompt'}" has been approved, and the content is now restored to active status.`
      );

      await dispatchEmail(email, 'appeal_approved', {
        username: appeal.creator?.username || 'Creator',
        targetName: `Prompt "${appeal.prompt?.title || 'your prompt'}"`
      });
    } else {
      // Reject appeal: keep it removed
      // 4. Log to moderation_logs
      await supabase
        .from('moderation_logs')
        .insert([{
          moderator_id: adminUser.id,
          moderator_email: adminUser.email || 'moderator@prizom.com',
          action: 'reject_appeal',
          target_id: appeal.prompt_id,
          reason: `Prompt removal appeal rejected. Original violation confirmed.`
        }]);

      // 5. Send notifications
      await triggerNotification(
        appeal.user_id,
        null,
        'moderation',
        appeal.prompt_id,
        `Your appeal for prompt "${appeal.prompt?.title || 'your prompt'}" was rejected. The content will remain hidden.`
      );

      await dispatchEmail(email, 'appeal_rejected', {
        username: appeal.creator?.username || 'Creator',
        targetName: `Prompt "${appeal.prompt?.title || 'your prompt'}"`
      });
    }

    await revalidateModerationTargets({ promptId: appeal.prompt_id, userId: appeal.user_id, username: appeal.creator?.username });
    return { success: true };
  } catch (err: any) {
    console.error('Error in resolvePromptAppealAction:', err);
    return { success: false, error: err.message };
  }
}

export async function toggleUserVerification(userId: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  const supabase = await createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, badges, verification_source')
    .eq('id', userId)
    .single();

  if (!profile) return { success: false, error: 'User profile not found' };

  let badges: string[] = profile.badges || [];
  const hasVerified = badges.includes('verified');

  if (!hasVerified) {
    badges.push('verified');
    
    const { error } = await supabase
      .from('profiles')
      .update({ badges, verification_source: 'manual' })
      .eq('id', userId);

    if (error) return { success: false, error: error.message };

    await store.addModerationLog(adminUser.email!, 'manual_verify_user', userId, 'Creator verification manually granted by Admin.');
    await triggerNotification(userId, null, 'verification', null, 'Congratulations! Your profile is now verified with a Prizom Creator Badge! 🎖️');
  } else {
    badges = badges.filter(b => b !== 'verified');
    
    const { error } = await supabase
      .from('profiles')
      .update({ badges, verification_source: null })
      .eq('id', userId);

    if (error) return { success: false, error: error.message };

    await store.addModerationLog(adminUser.email!, 'manual_unverify_user', userId, 'Creator verification manually revoked by Admin.');
    await triggerNotification(userId, null, 'moderation', null, 'Your verified creator badge has been manually removed by the moderation team.');
  }

  // Revalidate all caches across the platform to ensure immediate visual updates
  revalidatePath('/admin/users');
  revalidatePath('/');
  revalidatePath('/discover');
  revalidatePath('/trending');
  if (profile.username) {
    revalidatePath(`/creator/${profile.username}`);
    revalidatePath(`/creator/${profile.username}/analytics`);
  }
  revalidatePath('/prompt/[id]', 'layout');

  return { success: true };
}

// 4. Prompt Moderation
export async function getAdminPromptsList(searchQuery: string = '') {
  await assertModeratorOrAbove();
  const supabase = await createClient();

  let query = supabase
    .from('prompts')
    .select('*, creator:profiles!user_id(username, full_name), reports:prompt_reports(count)')
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`);
  }

  const { data: prompts, error } = await query;
  if (error) return { success: false, error: error.message };

  const featuredList = await store.getFeaturedPrompts();
  const boostMap = await store.getManualBoosts();
  const exploreSecs = await store.getExploreSections();

  const formatted = prompts.map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    promptText: p.prompt_text,
    imageUrl: p.image_url,
    aiTool: p.ai_tool,
    likesCount: p.likes_count,
    copiesCount: p.copies_count,
    remixCount: p.remix_count,
    createdAt: p.created_at,
    creatorUsername: p.creator?.username || 'unknown',
    creatorFullName: p.creator?.full_name || '',
    isFeatured: featuredList.includes(p.id),
    isHidden: p.moderation_status === 'pending_deletion',
    moderationReason: p.moderation_reason,
    boostWeight: boostMap[p.id] || 1.0,
    reportCount: p.reports?.[0]?.count || 0,
    assignedSections: exploreSecs.filter(s => s.type === 'curated' && s.prompt_ids?.includes(p.id)).map(s => s.id),
    category: p.category
  }));

  return { success: true, prompts: formatted };
}

export async function removePromptAction(promptId: string, reason: string) {
  if (!reason || !reason.trim()) {
    return { success: false, error: 'Removal reason is required.' };
  }

  try {
    const { user: adminUser } = await assertModeratorOrAbove();
    const supabaseAdmin = await createAdminClient();

    // Find prompt owner
    const { data: prompt } = await supabaseAdmin
      .from('prompts')
      .select('user_id, title')
      .eq('id', promptId)
      .single();

    if (!prompt) return { success: false, error: 'Prompt not found' };

    // Update prompt moderation status in PostgreSQL
    const { error: updateErr } = await supabaseAdmin
      .from('prompts')
      .update({
        moderation_status: 'pending_deletion',
        moderation_reason: reason,
        moderated_at: new Date().toISOString(),
        moderated_by: adminUser.id
      })
      .eq('id', promptId);

    if (updateErr) throw updateErr;

    // Log to moderation_logs table
    const { error: logErr } = await supabaseAdmin
      .from('moderation_logs')
      .insert([{
        moderator_id: adminUser.id,
        moderator_email: adminUser.email || 'moderator@prizom.com',
        action: 'remove_prompt',
        target_id: promptId,
        reason: reason
      }]);

    if (logErr) console.error('Failed to write database moderation log:', logErr);

    // Send platform notification
    await triggerNotification(
      prompt.user_id,
      null, // System actor
      'moderation',
      promptId,
      `Your prompt "${prompt.title}" has been removed due to a policy violation: "${reason}". You have 15 days to appeal this decision.`
    );

    let creatorUsername = '';
    // Send email alert (simulated)
    try {
      const { data: creatorProfile } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('id', prompt.user_id)
        .single();
        
      creatorUsername = creatorProfile?.username || '';
      const email = creatorUsername ? `${creatorUsername}@prizom.com` : 'creator@prizom.com';

      await dispatchEmail(email, 'prompt_removed', {
        username: creatorProfile?.username || 'Creator',
        promptTitle: prompt.title,
        reason: reason
      });
    } catch (e) {
      console.error('Failed to send moderation email:', e);
    }

    await revalidateModerationTargets({ promptId, userId: prompt.user_id, username: creatorUsername });
    return { success: true };
  } catch (err: any) {
    console.error('Error in removePromptAction:', err);
    return { success: false, error: err.message };
  }
}

export async function restorePromptAction(promptId: string) {
  try {
    const { user: adminUser } = await assertModeratorOrAbove();
    const supabaseAdmin = await createAdminClient();

    // Find prompt owner
    const { data: prompt } = await supabaseAdmin
      .from('prompts')
      .select('user_id, title')
      .eq('id', promptId)
      .single();

    if (!prompt) return { success: false, error: 'Prompt not found' };

    // Clear prompt moderation status in PostgreSQL
    const { error: updateErr } = await supabaseAdmin
      .from('prompts')
      .update({
        moderation_status: 'active',
        moderation_reason: null,
        moderated_at: null,
        moderated_by: null
      })
      .eq('id', promptId);

    if (updateErr) throw updateErr;

    // Log to moderation_logs table
    const { error: logErr } = await supabaseAdmin
      .from('moderation_logs')
      .insert([{
        moderator_id: adminUser.id,
        moderator_email: adminUser.email || 'moderator@prizom.com',
        action: 'restore_prompt',
        target_id: promptId,
        reason: 'Restored by moderator'
      }]);

    if (logErr) console.error('Failed to write database moderation log:', logErr);

    // Send platform notification
    await triggerNotification(
      prompt.user_id,
      null, // System actor
      'moderation',
      promptId,
      `Your prompt "${prompt.title}" has been successfully restored by the moderation team.`
    );

    let creatorUsername = '';
    try {
      const { data: creatorProfile } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('id', prompt.user_id)
        .single();
      creatorUsername = creatorProfile?.username || '';
    } catch (e) {
      console.error('Failed to fetch creator profile:', e);
    }

    await revalidateModerationTargets({ promptId, userId: prompt.user_id, username: creatorUsername });
    return { success: true };
  } catch (err: any) {
    console.error('Error in restorePromptAction:', err);
    return { success: false, error: err.message };
  }
}

// Keep legacy export mapped for compatibility with other components
export async function togglePromptHide(promptId: string, reason: string = '') {
  const supabase = await createAdminClient();
  const { data: p } = await supabase.from('prompts').select('moderation_status').eq('id', promptId).single();
  if (p?.moderation_status === 'pending_deletion') {
    return restorePromptAction(promptId);
  } else {
    return removePromptAction(promptId, reason || 'Policy violations');
  }
}

export async function togglePromptFeature(promptId: string) {
  try {
    const { user: adminUser } = await assertModeratorOrAbove();
    const supabase = await createClient();

    const { data: prompt } = await supabase
      .from('prompts')
      .select('user_id, title')
      .eq('id', promptId)
      .single();

    if (!prompt) return { success: false, error: 'Prompt not found' };

    const featured = await store.getFeaturedPrompts();
    const isCurrentlyFeatured = featured.includes(promptId);

    await store.featurePrompt(promptId, !isCurrentlyFeatured);
    await store.addModerationLog(adminUser.email!, isCurrentlyFeatured ? 'unfeature_prompt' : 'feature_prompt', promptId, '');

    if (!isCurrentlyFeatured) {
      await triggerNotification(prompt.user_id, null, 'achievement', promptId, `Brilliant! Your prompt "${prompt.title}" has been Featured on Prizom! ⭐`);
    }

    revalidatePath('/admin/prompts');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updatePromptBoost(promptId: string, boost: number) {
  try {
    const { user: adminUser } = await assertModeratorOrAbove();
    await store.setPromptBoost(promptId, boost);
    await store.addModerationLog(adminUser.email!, 'boost_prompt', promptId, `Manual trending weight set to ${boost}x`);
    revalidatePath('/admin/prompts');
    revalidatePath('/trending');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 5. Moderation safety reports queue
export async function getAdminReports() {
  await assertModeratorOrAbove();
  const supabaseAdmin = await createAdminClient();

  // Load Prompt reports
  const { data: promptReports, error: prErr } = await supabaseAdmin
    .from('prompt_reports')
    .select('*, reporter:profiles!prompt_reports_reporter_id_fkey(username), prompt:prompts(title, description, prompt_text, image_url, user_id, moderation_status, profiles!user_id(username, avatar_url))')
    .order('created_at', { ascending: false });

  // Load User reports
  const { data: userReports, error: urErr } = await supabaseAdmin
    .from('user_reports')
    .select('*, reporter:profiles!user_reports_reporter_id_fkey(username), reported:profiles!user_reports_reported_id_fkey(username, avatar_url)')
    .order('created_at', { ascending: false });

  // Load Account Appeals (from profiles where role is suspended or appeal_status is set)
  const { data: accountAppeals, error: aaErr } = await supabaseAdmin
    .from('profiles')
    .select('id, username, avatar_url, role, appeal_status, appeal_reason, appeal_supporting_info, suspended_at, updated_at')
    .not('appeal_status', 'is', null)
    .order('updated_at', { ascending: false });

  // Load Prompt Appeals (from prompt_appeals table)
  const { data: promptAppeals, error: paErr } = await supabaseAdmin
    .from('prompt_appeals')
    .select('*, prompt:prompts(title, description, prompt_text, image_url, user_id, profiles!user_id(username, avatar_url))')
    .order('created_at', { ascending: false });

  if (prErr || urErr || aaErr || paErr) {
    return { 
      success: false, 
      error: prErr?.message || urErr?.message || aaErr?.message || paErr?.message 
    };
  }

  const bannedList = await store.getBannedUsers();

  const formattedPromptReports = (promptReports || []).map((r: any) => ({
    id: r.id,
    type: 'prompt',
    reporterName: r.reporter?.username || 'anonymous',
    targetId: r.prompt_id,
    targetTitle: r.prompt?.title || r.prompt_snapshot?.title || 'Deleted Prompt',
    targetImageUrl: r.prompt?.image_url || r.prompt_snapshot?.image_url || '',
    promptText: r.prompt?.prompt_text || r.prompt_snapshot?.prompt_text || '',
    promptDescription: r.prompt?.description || r.prompt_snapshot?.description || '',
    ownerId: r.prompt?.user_id || r.prompt_snapshot?.user_id || '',
    creatorUsername: r.prompt?.profiles?.username || 'unknown',
    creatorAvatarUrl: r.prompt?.profiles?.avatar_url || '',
    reason: r.reason,
    details: r.details,
    status: r.status,
    createdAt: r.created_at,
    promptSnapshot: r.prompt_snapshot,
    isResolved: r.status === 'resolved' || r.status === 'dismissed' || r.prompt?.moderation_status === 'pending_deletion'
  }));

  const formattedUserReports = (userReports || []).map((r: any) => ({
    id: r.id,
    type: 'user',
    reporterName: r.reporter?.username || 'anonymous',
    targetId: r.reported_id,
    targetTitle: r.reported?.username || 'Deleted User',
    targetImageUrl: r.reported?.avatar_url || '',
    ownerId: r.reported_id,
    creatorUsername: r.reported?.username || 'unknown',
    creatorAvatarUrl: r.reported?.avatar_url || '',
    reason: r.reason,
    details: r.details,
    status: r.status,
    createdAt: r.created_at,
    isResolved: r.status === 'resolved' || r.status === 'dismissed' || bannedList.some(bu => bu.userId === r.reported_id)
  }));

  const formattedAccountAppeals = (accountAppeals || []).map((a: any) => ({
    id: a.id, // User ID is the appeal identifier
    type: 'account_appeal',
    reporterName: a.username,
    targetId: a.id,
    targetTitle: `Account Suspension Appeal: @${a.username}`,
    targetImageUrl: a.avatar_url || '',
    ownerId: a.id,
    creatorUsername: a.username,
    creatorAvatarUrl: a.avatar_url || '',
    reason: a.appeal_reason || 'No reason specified',
    details: a.appeal_supporting_info || 'No supporting details provided.',
    status: a.appeal_status,
    createdAt: a.suspended_at || a.updated_at,
    isResolved: a.appeal_status === 'approved' || a.appeal_status === 'rejected'
  }));

  const formattedPromptAppeals = (promptAppeals || []).map((p: any) => ({
    id: p.id,
    type: 'prompt_appeal',
    reporterName: p.prompt?.profiles?.username || 'unknown',
    targetId: p.prompt_id,
    targetTitle: `Prompt Appeal: "${p.prompt?.title || 'Removed Prompt'}"`,
    targetImageUrl: p.prompt?.image_url || '',
    promptText: p.prompt?.prompt_text || '',
    promptDescription: p.prompt?.description || '',
    ownerId: p.user_id,
    creatorUsername: p.prompt?.profiles?.username || 'unknown',
    creatorAvatarUrl: p.prompt?.profiles?.avatar_url || '',
    reason: p.reason,
    details: p.supporting_info || 'No supporting info.',
    status: p.status, // pending, approved, rejected
    createdAt: p.created_at,
    isResolved: p.status === 'approved' || p.status === 'rejected'
  }));

  const { data: dbLogs } = await supabaseAdmin
    .from('moderation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const formattedModerationLogs = (dbLogs || []).map((l: any) => ({
    id: l.id,
    adminEmail: l.moderator_email,
    action: l.action,
    targetId: l.target_id,
    reason: l.reason,
    timestamp: l.created_at
  }));

  return {
    success: true,
    promptReports: formattedPromptReports,
    userReports: formattedUserReports,
    accountAppeals: formattedAccountAppeals,
    promptAppeals: formattedPromptAppeals,
    moderationLogs: formattedModerationLogs
  };
}

export async function updateReportStatus(
  type: 'prompt' | 'user',
  reportId: string,
  status: 'under_review' | 'resolved' | 'dismissed' | 'escalated',
  actionTakenReason: string = '',
  actionTakenType?: 'hide' | 'warn' | 'suspend' | 'permanent_ban'
) {
  const { user: adminUser } = await assertModeratorOrAbove();
  const supabaseAdmin = await createAdminClient();

  const table = type === 'prompt' ? 'prompt_reports' : 'user_reports';
  
  // 1. Fetch report details first to get the reporter_id and target info
  const columns = type === 'prompt' ? 'reporter_id, prompt_id' : 'reporter_id, reported_id';
  const { data: reportDataData } = await supabaseAdmin
    .from(table)
    .select(columns)
    .eq('id', reportId)
    .maybeSingle();
  const reportData = reportDataData as any;

  // 1. If resolving with violation, perform action
  if (status === 'resolved') {
    const finalReason = actionTakenReason || 'Community guidelines violation.';
    if (type === 'prompt') {
      if (actionTakenType === 'warn') {
        if (reportData?.prompt_id) {
          const { data: prompt } = await supabaseAdmin
            .from('prompts')
            .select('user_id, title')
            .eq('id', reportData.prompt_id)
            .maybeSingle();
          if (prompt) {
            await triggerNotification(
              prompt.user_id,
              null,
              'moderation',
              reportData.prompt_id,
              `Content Warning: Your prompt "${prompt.title}" has received a warning for: "${finalReason}". Please review guidelines.`
            );
            
            try {
              const { data: creatorProfile } = await supabaseAdmin
                .from('profiles')
                .select('username')
                .eq('id', prompt.user_id)
                .single();
              const email = creatorProfile?.username ? `${creatorProfile.username}@prizom.com` : 'creator@prizom.com';

              await dispatchEmail(email, 'prompt_warning', {
                username: creatorProfile?.username || 'Creator',
                promptTitle: prompt.title,
                reason: finalReason
              });
            } catch (e) {
              console.error('Failed to send warning email:', e);
            }
          }
        }
      } else {
        // default 'hide'
        await togglePromptHide(reportData.prompt_id, `Report Resolved: ${finalReason}`);
      }
    } else if (type === 'user') {
      if (actionTakenType === 'warn') {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('username')
          .eq('id', reportData.reported_id)
          .maybeSingle();
        const email = profile ? `${profile.username}@prizom.com` : 'creator@prizom.com';

        await triggerNotification(
          reportData.reported_id,
          null,
          'moderation',
          null,
          `Account Warning Alert: Please review guidelines. Reason: ${finalReason}`
        );

        try {
          await dispatchEmail(email, 'account_warning', {
            username: profile?.username || 'Creator',
            reason: finalReason
          });
        } catch (e) {
          console.error('Failed to send warning email:', e);
        }
        await supabaseAdmin
          .from('moderation_logs')
          .insert([{
            moderator_id: adminUser.id,
            moderator_email: adminUser.email || 'moderator@prizom.com',
            action: 'ACCOUNT_WARNED',
            target_id: reportData.reported_id,
            reason: finalReason
          }]);
        await store.addModerationLog(adminUser.email!, 'ACCOUNT_WARNED', reportData.reported_id, finalReason);
      } else if (actionTakenType === 'permanent_ban') {
        await toggleUserBan(reportData.reported_id, `Report Resolved: ${finalReason}`, 'permanently_banned');
      } else {
        // default 'suspend'
        await toggleUserBan(reportData.reported_id, `Report Resolved: ${finalReason}`, 'suspended');
      }
    }
  }

  // Update status in Postgres
  const { error } = await supabaseAdmin
    .from(table)
    .update({ status })
    .eq('id', reportId);

  if (error) return { success: false, error: error.message };

  await supabaseAdmin
    .from('moderation_logs')
    .insert([{
      moderator_id: adminUser.id,
      moderator_email: adminUser.email || 'moderator@prizom.com',
      action: `report_${status}`,
      target_id: reportId,
      reason: `Type: ${type}. Action explanation: ${actionTakenReason || 'No custom notes'}`
    }]);
  await store.addModerationLog(
    adminUser.email!,
    `report_${status}`,
    reportId,
    `Type: ${type}. Action explanation: ${actionTakenReason || 'No custom notes'}`
  );

  // 2. Automatically send status notification to the original reporter
  if (reportData?.reporter_id) {
    const statusLabels: Record<string, string> = {
      under_review: 'moved to Under Review',
      escalated: 'escalated for senior admin review',
      resolved: 'resolved',
      dismissed: 'dismissed after review'
    };
    const textLabel = statusLabels[status] || `marked as ${status}`;
    const textMessage = `Your report against ${type} (Ref ID: ${reportId.substring(0, 8)}...) has been ${textLabel}.`;

    try {
      await triggerNotification(
        reportData.reporter_id,
        null, // System actor
        'report',
        reportId,
        textMessage
      );
    } catch (e) {
      console.error('Failed to trigger reporter notification:', e);
    }
  }

  // Re-evaluate verified creator standing of the reported user/creator
  if (type === 'prompt' && reportData?.prompt_id) {
    const { data: promptData } = await supabaseAdmin
      .from('prompts')
      .select('user_id')
      .eq('id', reportData.prompt_id)
      .maybeSingle();
    if (promptData?.user_id) {
      await evaluateCreatorVerificationStanding(promptData.user_id);
    }
  } else if (type === 'user' && reportData?.reported_id) {
    await evaluateCreatorVerificationStanding(reportData.reported_id);
  }

  revalidatePath('/admin/reports');
  return { success: true };
}

// 6. Platform CMS Editor
export async function getCMSContent() {
  await assertAdminOrAbove();
  const currentStore = await store.getStore();
  return {
    success: true,
    homepage: currentStore.homepage_settings,
    developer: currentStore.meet_developer,
    footer: currentStore.footer_settings
  };
}

export async function updateHomepageCMS(settings: Partial<store.HomepageSettings>) {
  const { user: adminUser } = await assertAdminOrAbove();
  const currentStore = await store.getStore();
  currentStore.homepage_settings = {
    ...currentStore.homepage_settings,
    ...settings
  };

  await store.saveStore(currentStore);
  await store.addModerationLog(adminUser.email!, 'update_homepage_cms', 'settings', 'Updated homepage hero text or banner.');
  
  revalidatePath('/');
  return { success: true };
}

export async function updateDeveloperCMS(settings: Partial<store.MeetDeveloperSettings>) {
  try {
    const { user: adminUser } = await assertSuperAdmin();

    const currentStore = await store.getStore();
    const oldAvatarUrl = currentStore.meet_developer?.avatar_url;

    if (settings.avatar_url && oldAvatarUrl && settings.avatar_url !== oldAvatarUrl) {
      try {
        const { deleteCloudinaryAsset } = await import('@/lib/cloudinary');
        await deleteCloudinaryAsset(oldAvatarUrl);
      } catch (delErr) {
        console.warn('[CLOUDINARY CLEANUP WARN] Failed to delete old developer avatar:', delErr);
      }
    }

    currentStore.meet_developer = {
      ...currentStore.meet_developer,
      ...settings
    };

    await store.saveStore(currentStore);
    await store.addModerationLog(adminUser.email!, 'update_developer_cms', 'settings', 'Updated Developer profile section contents.');
    
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateFooterCMS(settings: Partial<store.FooterSettings>) {
  try {
    const { user: adminUser } = await assertSuperAdmin();

    const currentStore = await store.getStore();
    currentStore.footer_settings = {
      ...currentStore.footer_settings,
      ...settings
    };

    await store.saveStore(currentStore);
    await store.addModerationLog(adminUser.email!, 'update_footer_cms', 'settings', 'Footer configurations updated.');
    
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 7. Team management (super_admin only)
export async function getAdminTeamList() {
  await assertSuperAdmin();
  const currentStore = await store.getStore();
  const whitelistedAdmins = currentStore.admin_users;

  const supabase = await createAdminClient();
  let authUsers: any[] = [];
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (!error && data?.users) {
      authUsers = data.users;
    }
  } catch (err) {
    console.warn('Failed to fetch auth users list:', err);
  }

  let profiles: any[] = [];
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data) {
      profiles = data;
    }
  } catch (err) {
    console.warn('Failed to fetch profiles:', err);
  }

  const team = whitelistedAdmins.map(admin => {
    const authUser = authUsers.find(u => u.email?.toLowerCase() === admin.email.toLowerCase());
    const profile = authUser ? profiles.find(p => p.id === authUser.id) : null;

    return {
      email: admin.email,
      role: admin.role,
      accountExists: !!authUser,
      syncedInDb: profile ? profile.role === admin.role : false,
      status: authUser ? 'Active' : 'Pending Signup',
      avatarUrl: profile?.avatar_url || null,
      fullName: profile?.full_name || null,
      username: profile?.username || null,
      createdAt: authUser?.created_at || profile?.created_at || null,
      lastSignInAt: authUser?.last_sign_in_at || profile?.updated_at || null
    };
  });

  return { success: true, team, serviceKeyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY };
}

export async function inviteAdminUser(email: string, role: 'super_admin' | 'admin' | 'moderator') {
  const { user: adminUser } = await assertSuperAdmin();

  const added = await store.addAdminUser(email, role);
  if (!added) return { success: false, error: 'User is already an administrator or invite failed.' };

  const supabase = await createAdminClient();
  let userToUpdate = null;
  try {
    const { data } = await supabase.auth.admin.listUsers();
    userToUpdate = data?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
  } catch (err) {
    console.warn(err);
  }

  if (userToUpdate) {
    await supabase.from('profiles').update({ role }).eq('id', userToUpdate.id);
    await triggerNotification(userToUpdate.id, null, 'moderation', null, `You have been invited to the Admin Team as ${role}. Please refresh or log in.`);
  }

  await store.addModerationLog(adminUser.email!, 'invite_admin', email, `Added team role: ${role}`);
  return { success: true };
}

export async function removeAdminUserAction(email: string) {
  const { user: adminUser } = await assertSuperAdmin();

  const removed = await store.removeAdminUser(email);
  if (!removed) return { success: false, error: 'Failed to remove admin. Cannot delete the last super admin.' };

  const supabase = await createAdminClient();
  let userToDemote = null;
  try {
    const { data } = await supabase.auth.admin.listUsers();
    userToDemote = data?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
  } catch (err) {
    console.warn(err);
  }

  if (userToDemote) {
    await supabase.from('profiles').update({ role: 'user' }).eq('id', userToDemote.id);
    await supabase.auth.admin.updateUserById(userToDemote.id, {
      user_metadata: { role: 'user' }
    });
    await triggerNotification(userToDemote.id, null, 'moderation', null, `Your administrative privileges have been revoked.`);
  }

  await store.addModerationLog(adminUser.email!, 'remove_admin', email, 'Team member deleted.');
  return { success: true };
}

// 8. Load Audit logs (super_admin & admin)
export async function getAuditLogs() {
  await assertAdminOrAbove();
  const supabase = await createClient();
  const { data: logs, error } = await supabase
    .from('moderation_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };

  const formatted = (logs || []).map((l: any) => ({
    id: l.id,
    adminEmail: l.moderator_email,
    action: l.action,
    targetId: l.target_id,
    reason: l.reason || '',
    timestamp: l.created_at
  }));

  return { success: true, logs: formatted };
}

// 9. Public CMS Read (Unauthenticated)
export async function getPublicCMS() {
  const currentStore = await store.getStore();
  return {
    success: true,
    homepage: currentStore.homepage_settings,
    developer: currentStore.meet_developer,
    footer: currentStore.footer_settings,
    featuredPrompts: currentStore.featured_prompts,
    hiddenPrompts: [], // Decoupled: moderation status now stored in PostgreSQL & filtered via RLS
    manualBoosts: currentStore.manual_boosts,
    bannedUsers: currentStore.banned_users.map(bu => bu.userId),
    exploreSections: currentStore.explore_sections || store.DEFAULT_EXPLORE_SECTIONS
  };
}

// 10. Contact Us Message Actions (Public & Admin management)
export async function submitContactMessageAction(email: string, message: string, turnstileToken?: string) {
  if (!email || !message) {
    return { success: false, error: 'Email and message content are required' };
  }

  // 1. CAPTCHA verification
  const captchaCheck = await verifyTurnstileToken(turnstileToken);
  if (!captchaCheck.success) {
    return { success: false, error: captchaCheck.error || 'CAPTCHA validation failed.' };
  }

  const ipHash = await getClientIpHash();
  const ipLimit = await rateLimit(ipHash, 'contact', 3, 60 * 60 * 1000);
  if (!ipLimit.success) {
    return { success: false, error: 'Too many contact messages from this IP. Please try again in an hour.' };
  }
  const added = await store.addContactMessage(email, message);
  if (!added) return { success: false, error: 'Failed to record message. Please try again.' };
  return { success: true };
}

export async function getContactMessagesAdmin() {
  await assertModeratorOrAbove();
  try {
    const messages = await store.getContactMessages();
    return { success: true, messages };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateContactMessageStatusAdmin(id: string, status: 'unread' | 'read' | 'archived') {
  await assertModeratorOrAbove();
  const updated = await store.updateContactMessageStatus(id, status);
  if (!updated) return { success: false, error: 'Failed to update message status' };
  return { success: true };
}

export async function deleteContactMessageAdmin(id: string) {
  await assertModeratorOrAbove();
  const deleted = await store.deleteContactMessage(id);
  if (!deleted) return { success: false, error: 'Failed to delete message' };
  return { success: true };
}

// 11. Broadcast Notifications
export async function broadcastAdminNotificationAction(type: 'achievement', text: string, targetUserId?: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  const supabase = await createClient();

  if (!text) {
    return { success: false, error: 'Announcement message is required' };
  }

  try {
    if (targetUserId && targetUserId !== 'all') {
      await triggerNotification(targetUserId, null, type, null, text);
      await store.addModerationLog(adminUser.email!, 'broadcast_notification', targetUserId, `Direct alert: ${text}`);
    } else {
      const supabaseAdmin = await createAdminClient();
      const { error: rpcErr } = await supabaseAdmin.rpc('broadcast_notification_bulk', {
        notification_type: type,
        notification_text: text
      });
      if (rpcErr) throw rpcErr;
      
      await store.addModerationLog(adminUser.email!, 'broadcast_notification_all', 'all', `Global alert: ${text}`);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 16. Explore Section management
export async function getExploreSectionsAction() {
  await assertAdminOrAbove();
  try {
    const sections = await store.getExploreSections();
    return { success: true, sections };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createExploreSectionAction(title: string, type: 'curated' | 'dynamic', algorithm?: 'trending' | 'most_remixed' | 'new_creators' | 'recent') {
  const { user: adminUser } = await assertAdminOrAbove();
  if (!title.trim()) return { success: false, error: 'Section title cannot be empty.' };

  const id = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!id) return { success: false, error: 'Invalid section title.' };

  const currentSections = await store.getExploreSections();
  const order = currentSections.length + 1;
  const newSec: store.ExploreSection = {
    id,
    title: title.trim(),
    type,
    algorithm: type === 'dynamic' ? algorithm : undefined,
    prompt_ids: type === 'curated' ? [] : undefined,
    is_hidden: false,
    is_featured: false,
    order
  };

  const success = await store.addExploreSection(newSec);
  if (!success) return { success: false, error: 'Section already exists or failed to save.' };

  await store.addModerationLog(adminUser.email!, 'create_explore_section', id, `Created section: ${title}`);
  revalidatePath('/discover');
  return { success: true, section: newSec };
}

export async function editExploreSectionAction(id: string, title: string, isHidden: boolean, isFeatured: boolean, order?: number, promptIds?: string[]) {
  const { user: adminUser } = await assertAdminOrAbove();
  if (!title.trim()) return { success: false, error: 'Section title cannot be empty.' };

  const currentSections = await store.getExploreSections();
  const found = currentSections.find(s => s.id === id);
  if (!found) return { success: false, error: 'Section not found.' };

  found.title = title.trim();
  found.is_hidden = isHidden;
  found.is_featured = isFeatured;
  if (order !== undefined) {
    found.order = order;
  }
  if (promptIds !== undefined) {
    found.prompt_ids = promptIds;
  }

  const success = await store.updateExploreSection(found);
  if (!success) return { success: false, error: 'Failed to update explore section.' };

  await store.addModerationLog(adminUser.email!, 'edit_explore_section', id, `Updated section: ${title}`);
  revalidatePath('/discover');
  return { success: true, section: found };
}

export async function deleteExploreSectionAction(id: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  const success = await store.deleteExploreSection(id);
  if (!success) return { success: false, error: 'Failed to delete section.' };

  await store.addModerationLog(adminUser.email!, 'delete_explore_section', id, `Deleted explore section ID: ${id}`);
  revalidatePath('/discover');
  return { success: true };
}

export async function reorderExploreSectionsAction(orders: { id: string; order: number }[]) {
  const { user: adminUser } = await assertAdminOrAbove();
  const success = await store.reorderExploreSections(orders);
  if (!success) return { success: false, error: 'Failed to save section order.' };

  await store.addModerationLog(adminUser.email!, 'reorder_explore_sections', 'all', 'Reordered explore sections list.');
  revalidatePath('/discover');
  return { success: true };
}

export async function assignPromptToSectionAction(promptId: string, sectionId: string, assign: boolean) {
  const { user: adminUser } = await assertAdminOrAbove();
  const success = await store.assignPromptToSection(promptId, sectionId, assign);
  if (!success) return { success: false, error: 'Failed to assign prompt to section.' };

  await store.addModerationLog(adminUser.email!, assign ? 'assign_prompt_section' : 'unassign_prompt_section', `${promptId}:${sectionId}`, '');
  revalidatePath('/discover');
  return { success: true };
}

// 12. Contact Message Reply System
export async function replyToContactMessageAdmin(messageId: string, replyText: string) {
  const { user: adminUser } = await assertModeratorOrAbove();
  if (!replyText.trim()) return { success: false, error: 'Reply text cannot be empty.' };

  const currentStore = await store.getStore();
  if (!currentStore.contact_messages) currentStore.contact_messages = [];

  const foundMsg = currentStore.contact_messages.find(m => m.id === messageId);
  if (!foundMsg) return { success: false, error: 'Message not found.' };

  if (!foundMsg.replies) foundMsg.replies = [];
  
  foundMsg.replies.push({
    body: replyText.trim(),
    repliedAt: new Date().toISOString(),
    adminEmail: adminUser.email!
  });

  foundMsg.status = 'read'; // Auto-mark as read on reply

  // 1. Dispatch actual email using Resend integration
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e4e4e7; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #18181b;">Prizom <span style="color: #6366f1;">Support</span></span>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #3f3f46; margin-bottom: 20px;">Hello,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #3f3f46; margin-bottom: 20px;">Our administration team has reviewed and replied to your platform inquiry:</p>
      <div style="background-color: #f4f4f5; padding: 20px; border-left: 4px solid #6366f1; border-radius: 12px; font-size: 14px; line-height: 1.6; color: #18181b; font-style: italic; margin: 24px 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.01);">
        "${replyText.trim()}"
      </div>
      <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
      <div style="font-size: 11px; line-height: 1.5; color: #71717a;">
        <strong style="color: #3f3f46; display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px;">Original Message Inquiry:</strong>
        <p style="margin: 0; font-style: italic;">"${foundMsg.message}"</p>
      </div>
      <p style="font-size: 11px; color: #a1a1aa; margin-top: 24px; border-t: 1px solid #f4f4f5; pt: 16px;">This is a system notification dispatched from the Prizom Moderator Node.</p>
    </div>
  `;

  const emailRes = await dispatchEmail(foundMsg.email, 'contact_reply', {
    replyText: replyText,
    originalMessage: foundMsg.message
  });

  const saved = await store.saveStore(currentStore);
  if (!saved) return { success: false, error: 'Failed to save reply history.' };

  // Log moderation action
  await store.addModerationLog(adminUser.email!, 'reply_contact_message', messageId, `Replied to: ${foundMsg.email}`);

  // Diagnostics traces
  if (emailRes.success) {
    console.log(`[MAIL DISPATCH SUCCESS] Real support email reply dispatched to "${foundMsg.email}" via Resend. Message ID: ${emailRes.messageId}`);
  } else {
    console.warn(`[MAIL DISPATCH FAILED] Resend was unable to deliver message to "${foundMsg.email}": ${emailRes.error}`);
  }

  revalidatePath('/admin/messages');
  return { success: true, message: foundMsg, emailDelivery: emailRes };
}

export async function createCategoryAction(name: string, description: string = '', isFeatured: boolean = false, showOnExplore: boolean = true, coverImage: string = '') {
  const { user: adminUser } = await assertAdminOrAbove();
  if (!name.trim()) return { success: false, error: 'Category name cannot be empty.' };

  const id = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!id) return { success: false, error: 'Invalid category name.' };

  const currentStore = await store.getStore();
  if (!currentStore.categories) currentStore.categories = [];

  const order = currentStore.categories.length + 1;
  const newCat: store.Category = {
    id,
    name: name.trim(),
    description: description.trim(),
    cover_image: coverImage.trim() || undefined,
    order,
    is_featured: isFeatured,
    show_on_explore: showOnExplore,
    approved: true
  };

  const success = await store.addCategory(newCat);
  if (!success) return { success: false, error: 'Category already exists or failed to save.' };

  await store.addModerationLog(adminUser.email!, 'create_category', id, `Created category: ${name}`);
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true, category: newCat };
}

export async function editCategoryAction(id: string, name: string, description: string = '', isFeatured: boolean = false, showOnExplore: boolean = true, order?: number, coverImage?: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  if (!name.trim()) return { success: false, error: 'Category name cannot be empty.' };

  const currentStore = await store.getStore();
  if (!currentStore.categories) return { success: false, error: 'No categories available.' };

  const found = currentStore.categories.find(c => c.id === id);
  if (!found) return { success: false, error: 'Category not found.' };

  found.name = name.trim();
  found.description = description.trim();
  found.is_featured = isFeatured;
  found.show_on_explore = showOnExplore;
  if (coverImage !== undefined) {
    const newCoverImage = coverImage.trim() || undefined;
    const oldCoverImage = found.cover_image;
    if (oldCoverImage && newCoverImage !== oldCoverImage) {
      try {
        const { deleteCloudinaryAsset } = await import('@/lib/cloudinary');
        await deleteCloudinaryAsset(oldCoverImage);
      } catch (delErr) {
        console.warn('[CLOUDINARY CLEANUP WARN] Failed to delete old category cover image:', delErr);
      }
    }
    found.cover_image = newCoverImage;
  }
  if (order !== undefined) {
    found.order = order;
  }

  const success = await store.saveStore(currentStore);
  if (!success) return { success: false, error: 'Failed to update category.' };

  await store.addModerationLog(adminUser.email!, 'edit_category', id, `Updated category: ${name}`);
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true, category: found };
}

export async function deleteCategoryAction(id: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  
  const currentStore = await store.getStore();
  const found = currentStore.categories?.find(c => c.id === id);
  const coverImageToDelete = found?.cover_image;

  const success = await store.deleteCategory(id);
  if (!success) return { success: false, error: 'Failed to delete category.' };

  if (coverImageToDelete) {
    try {
      const { deleteCloudinaryAsset } = await import('@/lib/cloudinary');
      await deleteCloudinaryAsset(coverImageToDelete);
    } catch (delErr) {
      console.warn('[CLOUDINARY CLEANUP WARN] Failed to delete category cover image:', delErr);
    }
  }

  await store.addModerationLog(adminUser.email!, 'delete_category', id, `Deleted category ID: ${id}`);
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true };
}

export async function reorderCategoriesAction(orders: { id: string; order: number }[]) {
  const { user: adminUser } = await assertAdminOrAbove();
  const currentStore = await store.getStore();
  if (!currentStore.categories) return { success: false, error: 'No categories available.' };

  orders.forEach(item => {
    const found = currentStore.categories!.find(c => c.id === item.id);
    if (found) found.order = item.order;
  });

  // Re-sort array based on order index
  currentStore.categories.sort((a, b) => a.order - b.order);

  const success = await store.saveStore(currentStore);
  if (!success) return { success: false, error: 'Failed to save category order.' };

  await store.addModerationLog(adminUser.email!, 'reorder_categories', 'all', 'Reordered categories list.');
  revalidatePath('/discover');
  return { success: true };
}

export async function approveCategoryAction(id: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  const success = await store.approveCategory(id);
  if (!success) return { success: false, error: 'Failed to approve category.' };

  await store.addModerationLog(adminUser.email!, 'approve_category', id, `Approved category ID: ${id}`);
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true };
}

// AI Tool Moderation Actions
export async function createAiToolAction(name: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  if (!name.trim()) return { success: false, error: 'AI Tool name cannot be empty.' };

  const id = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!id) return { success: false, error: 'Invalid tool name.' };

  const newTool: store.AiTool = {
    id,
    name: name.trim(),
    approved: true
  };

  const success = await store.addAiTool(newTool);
  if (!success) return { success: false, error: 'AI Tool already exists.' };

  await store.addModerationLog(adminUser.email!, 'create_ai_tool', id, `Created AI Tool: ${name}`);
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true, tool: newTool };
}

export async function deleteAiToolAction(id: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  const success = await store.deleteAiTool(id);
  if (!success) return { success: false, error: 'Failed to delete AI Tool.' };

  await store.addModerationLog(adminUser.email!, 'delete_ai_tool', id, `Deleted AI Tool ID: ${id}`);
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true };
}

export async function approveAiToolAction(id: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  const success = await store.approveAiTool(id);
  if (!success) return { success: false, error: 'Failed to approve AI Tool.' };

  await store.addModerationLog(adminUser.email!, 'approve_ai_tool', id, `Approved AI Tool ID: ${id}`);
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true };
}

// 14. Public Unauthenticated Dynamic Categories & Tools fetch
export async function getPlatformCategoriesAndTools() {
  return {
    success: true,
    categories: await store.getCategories(),
    ai_tools: await store.getAiTools(),
    aspect_ratios: await store.getAspectRatios()
  };
}

// 15. Suggest category or AI Tool on prompt upload (Public user access)
export async function suggestCategoryOrToolAction(type: 'category' | 'tool', name: string) {
  if (!name.trim()) return { success: false, error: 'Name cannot be empty.' };
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const id = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!id) return { success: false, error: 'Invalid name.' };

  if (type === 'category') {
    const currentStore = await store.getStore();
    const isExisted = currentStore.categories?.some(c => c.id === id);
    if (isExisted) {
      return { success: true, category: currentStore.categories?.find(c => c.id === id) };
    }
    const order = (currentStore.categories?.length || 0) + 1;
    const newCat: store.Category = {
      id,
      name: name.trim(),
      order,
      is_featured: false,
      show_on_explore: false, // 🔴 Change to false
      approved: false,        // 🔴 Change to false (moderation required)
      suggestedBy: user.email
    };
    await store.addCategory(newCat);
    return { success: true, category: newCat };
  } else {
    const currentStore = await store.getStore();
    const isExisted = currentStore.ai_tools?.some(t => t.id === id);
    if (isExisted) {
      return { success: true, tool: currentStore.ai_tools?.find(t => t.id === id) };
    }
    const newTool: store.AiTool = {
      id,
      name: name.trim(),
      approved: false,        // 🔴 Change to false (moderation required)
      show_on_explore: false, // 🔴 Change to false
      suggestedBy: user.email
    };
    await store.addAiTool(newTool);
    return { success: true, tool: newTool };
  }
}

// 9. Creator Verification Eligibility & Stats Aggregator
export async function getCreatorVerificationDetails(userId: string) {
  const supabase = await createClient();

  try {
    // 1. Dual-Access Clearance Verification:
    // Only the target creator themselves or an administrator has clearance to fetch detailed numbers.
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    const isOwnProfile = currentUser.id === userId;
    if (!isOwnProfile) {
      // Bypasses to standard admin assert if querying another user's profile
      await assertAdminOrAbove();
    }

    // 2. Fetch Creator Profile
    const { data: creator, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileErr || !creator) {
      return { success: false, error: 'Creator profile not found.' };
    }

    // 3. Fetch all Published Prompts
    const { data: prompts, error: promptsErr } = await supabase
      .from('prompts')
      .select('id, copies_count, likes_count, saves_count')
      .eq('user_id', userId);

    const promptsList = prompts || [];
    const promptIds = promptsList.map(p => p.id);

    // Compute basic sums
    const totalPrompts = promptsList.length;
    let totalCopies = 0;
    if (promptIds.length > 0) {
      const { count: copyLogsCount } = await supabase
        .from('prompt_copy_logs')
        .select('*', { count: 'exact', head: true })
        .in('prompt_id', promptIds);
      totalCopies = copyLogsCount || 0;
    }
    const totalLikes = promptsList.reduce((sum, p) => sum + (p.likes_count || 0), 0);
    const totalSaves = promptsList.reduce((sum, p) => sum + (p.saves_count || 0), 0);

    // Fetch remixes count
    let totalRemixes = 0;
    if (promptIds.length > 0) {
      const { count } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .in('remix_of', promptIds);
      totalRemixes = count || 0;
    }

    // Fetch views count
    let totalViews = 0;
    if (promptIds.length > 0) {
      const { count } = await supabase
        .from('prompt_views')
        .select('*', { count: 'exact', head: true })
        .in('prompt_id', promptIds);
      totalViews = count || 0;
    }

    // 4. Fetch Moderation Reports
    const { count: profileReports } = await supabase
      .from('user_reports')
      .select('*', { count: 'exact', head: true })
      .eq('reported_id', userId)
      .eq('status', 'pending');

    let contentReports = 0;
    if (promptIds.length > 0) {
      const { count } = await supabase
        .from('prompt_reports')
        .select('*', { count: 'exact', head: true })
        .in('prompt_id', promptIds)
        .eq('status', 'pending');
      contentReports = count || 0;
    }

    const totalActiveViolations = (profileReports || 0) + (contentReports || 0);

    // 5. Calculate Account Age
    const accountCreatedDate = new Date(creator.created_at);
    const accountAgeDays = Math.max(0, Math.floor((Date.now() - accountCreatedDate.getTime()) / (1000 * 60 * 60 * 24)));

    // 6. Check if suspended
    const isSuspended = await store.isUserBanned(userId) || 
                        await store.isUserSuspended(userId) || 
                        creator.role === 'banned' || 
                        creator.role === 'suspended' || 
                        creator.role === 'permanently_banned';

    // 7. Verification Status check
    const isVerified = creator.badges?.includes('verified') || false;

    return {
      success: true,
      stats: {
        id: creator.id,
        username: creator.username,
        fullName: creator.full_name,
        avatarUrl: creator.avatar_url,
        bio: creator.bio,
        role: creator.role,
        badges: creator.badges || [],
        followerCount: creator.follower_count || 0,
        followingCount: creator.following_count || 0,
        createdAt: creator.created_at,
        accountAgeDays,
        totalPrompts,
        totalCopies,
        totalLikes,
        totalSaves,
        totalRemixes,
        totalViews,
        activeViolations: totalActiveViolations,
        isSuspended,
        isVerified,
        verificationSource: creator.verification_source
      }
    };
  } catch (err: any) {
    console.error('Failed to compile verification details:', err);
    return { success: false, error: err.message };
  }
}

// 17. Categories, Tools and Ratios Curation Actions
export async function mergeCategoriesAction(sourceId: string, targetId: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  const currentStore = await store.getStore();
  if (!currentStore.categories) return { success: false, error: 'No categories found.' };

  const sourceCat = currentStore.categories.find(c => c.id === sourceId);
  const targetCat = currentStore.categories.find(c => c.id === targetId);

  if (!sourceCat || !targetCat) {
    return { success: false, error: 'Source or target category not found.' };
  }

  const supabase = await createClient();
  // Update all matching prompts to use the new category name
  const { error } = await supabase
    .from('prompts')
    .update({ category: targetCat.name })
    .eq('category', sourceCat.name);

  if (error) {
    return { success: false, error: `Failed to update prompts: ${error.message}` };
  }

  // Remove source category from store
  currentStore.categories = currentStore.categories.filter(c => c.id !== sourceId);
  await store.saveStore(currentStore);

  await store.addModerationLog(adminUser.email!, 'merge_categories', `${sourceId}->${targetId}`, `Merged category ${sourceCat.name} into ${targetCat.name}`);
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true };
}

export async function mergeAiToolsAction(sourceId: string, targetId: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  const currentStore = await store.getStore();
  if (!currentStore.ai_tools) return { success: false, error: 'No AI tools found.' };

  const sourceTool = currentStore.ai_tools.find(t => t.id === sourceId);
  const targetTool = currentStore.ai_tools.find(t => t.id === targetId);

  if (!sourceTool || !targetTool) {
    return { success: false, error: 'Source or target tool not found.' };
  }

  const supabase = await createClient();
  // Update all matching prompts to use the new tool name
  const { error } = await supabase
    .from('prompts')
    .update({ ai_tool: targetTool.name })
    .eq('ai_tool', sourceTool.name);

  if (error) {
    return { success: false, error: `Failed to update prompts: ${error.message}` };
  }

  // Remove source tool from store
  currentStore.ai_tools = currentStore.ai_tools.filter(t => t.id !== sourceId);
  await store.saveStore(currentStore);

  await store.addModerationLog(adminUser.email!, 'merge_ai_tools', `${sourceId}->${targetId}`, `Merged tool ${sourceTool.name} into ${targetTool.name}`);
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true };
}

export async function renameCategoryAction(id: string, newName: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  if (!newName.trim()) return { success: false, error: 'Name cannot be empty.' };

  const currentStore = await store.getStore();
  if (!currentStore.categories) return { success: false, error: 'No categories found.' };

  const found = currentStore.categories.find(c => c.id === id);
  if (!found) return { success: false, error: 'Category not found.' };

  const oldName = found.name;
  found.name = newName.trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from('prompts')
    .update({ category: newName.trim() })
    .eq('category', oldName);

  if (error) {
    return { success: false, error: `Failed to update prompts: ${error.message}` };
  }

  await store.saveStore(currentStore);
  await store.addModerationLog(adminUser.email!, 'rename_category', id, `Renamed category ${oldName} to ${newName}`);
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true };
}

export async function renameAiToolAction(id: string, newName: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  if (!newName.trim()) return { success: false, error: 'Name cannot be empty.' };

  const currentStore = await store.getStore();
  if (!currentStore.ai_tools) return { success: false, error: 'No AI tools found.' };

  const found = currentStore.ai_tools.find(t => t.id === id);
  if (!found) return { success: false, error: 'AI Tool not found.' };

  const oldName = found.name;
  found.name = newName.trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from('prompts')
    .update({ ai_tool: newName.trim() })
    .eq('ai_tool', oldName);

  if (error) {
    return { success: false, error: `Failed to update prompts: ${error.message}` };
  }

  await store.saveStore(currentStore);
  await store.addModerationLog(adminUser.email!, 'rename_ai_tool', id, `Renamed tool ${oldName} to ${newName}`);
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true };
}

export async function toggleAiToolVisibilityAction(id: string) {
  const { user: adminUser } = await assertAdminOrAbove();
  const success = await store.toggleAiToolExplore(id);
  if (!success) return { success: false, error: 'Failed to toggle tool visibility.' };

  await store.addModerationLog(adminUser.email!, 'toggle_ai_tool_visibility', id, '');
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true };
}

export async function getAspectRatiosAction() {
  await assertAdminOrAbove();
  return { success: true, aspectRatios: await store.getAspectRatios() };
}

export async function updateAspectRatiosAction(ratios: store.AspectRatioOption[]) {
  const { user: adminUser } = await assertAdminOrAbove();
  const success = await store.updateAspectRatios(ratios);
  if (!success) return { success: false, error: 'Failed to update aspect ratios.' };

  await store.addModerationLog(adminUser.email!, 'update_aspect_ratios', 'all', 'Updated aspect ratio configurations.');
  return { success: true };
}

export async function reorderAiToolsAction(orders: { id: string; order: number }[]) {
  const { user: adminUser } = await assertAdminOrAbove();
  const currentStore = await store.getStore();
  if (!currentStore.ai_tools) return { success: false, error: 'No AI tools available.' };

  orders.forEach(item => {
    const found = currentStore.ai_tools!.find(t => t.id === item.id);
    if (found) found.order = item.order;
  });

  // Re-sort array based on order index
  currentStore.ai_tools.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const success = await store.saveStore(currentStore);
  if (!success) return { success: false, error: 'Failed to save AI Tools order.' };

  await store.addModerationLog(adminUser.email!, 'reorder_ai_tools', 'all', 'Reordered AI Tools list.');
  revalidatePath('/discover');
  return { success: true };
}

export async function updateSectionPromptsAction(sectionId: string, promptIds: string[]) {
  const { user: adminUser } = await assertAdminOrAbove();
  const currentSections = await store.getExploreSections();
  const found = currentSections.find(s => s.id === sectionId);
  if (!found) return { success: false, error: 'Section not found.' };

  found.prompt_ids = promptIds;

  // If editing featured section prompts, synchronize with featured_prompts for backward compat
  if (sectionId === 'featured') {
    const currentStore = await store.getStore();
    currentStore.featured_prompts = promptIds;
    await store.saveStore(currentStore);
  }

  const success = await store.updateExploreSection(found);
  if (!success) return { success: false, error: 'Failed to update section prompts.' };

  await store.addModerationLog(adminUser.email!, 'update_section_prompts', sectionId, `Updated prompts inside section: ${found.title}`);
  revalidatePath('/discover');
  revalidatePath('/');
  return { success: true, section: found };
}






export async function updateAdminUserRole(email: string, newRole: 'super_admin' | 'admin' | 'moderator') {
  const { user: adminUser } = await assertSuperAdmin();

  const currentStore = await store.getStore();
  const userObj = currentStore.admin_users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
  if (!userObj) {
    return { success: false, error: 'Admin user not found in whitelist.' };
  }

  // If changing role of a super_admin, verify we aren't leaving 0 super_admins
  if (userObj.role === 'super_admin' && newRole !== 'super_admin') {
    const superAdmins = currentStore.admin_users.filter(u => u.role === 'super_admin');
    if (superAdmins.length <= 1) {
      return { success: false, error: 'Cannot demote the last Super Admin.' };
    }
  }

  userObj.role = newRole;
  await store.saveStore(currentStore);

  const supabase = await createAdminClient();
  let userToUpdate = null;
  try {
    const { data } = await supabase.auth.admin.listUsers();
    userToUpdate = data?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
  } catch (err) {
    console.warn(err);
  }

  if (userToUpdate) {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userToUpdate.id);
    await supabase.auth.admin.updateUserById(userToUpdate.id, {
      user_metadata: { role: newRole }
    });
    await triggerNotification(userToUpdate.id, null, 'moderation', null, `Your team role has been updated to ${newRole}.`);
  }

  await store.addModerationLog(adminUser.email!, 'update_admin_role', email, `Updated team role to: ${newRole}`);
  return { success: true };
}

export async function completeAdminOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Get current profile
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('role, badges')
    .eq('id', user.id)
    .single();

  if (fetchError || !profile) {
    return { success: false, error: 'Profile not found.' };
  }

  // Only admins, moderators, super_admins should be onboarding
  if (!['super_admin', 'admin', 'moderator'].includes(profile.role)) {
    return { success: false, error: 'Only administrators can onboard.' };
  }

  const badges: string[] = Array.isArray(profile.badges) ? profile.badges : [];
  if (!badges.includes('admin_onboarded')) {
    badges.push('admin_onboarded');
  }

  const adminSupabase = await createAdminClient();
  const { error: updateError } = await adminSupabase
    .from('profiles')
    .update({ badges })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function evaluateCreatorVerificationStanding(userId: string) {
  const supabase = await createAdminClient();
  
  // 1. Fetch Creator Profile badges and verification_source
  const { data: profile } = await supabase
    .from('profiles')
    .select('badges, verification_source, username')
    .eq('id', userId)
    .single();

  if (!profile) return { success: false, error: 'Profile not found.' };

  let badges: string[] = profile.badges || [];
  const currentSource = profile.verification_source;
  const hasVerifiedBadge = badges.includes('verified');

  // 2. Fetch creator verification stats
  const detailsRes = await getCreatorVerificationDetails(userId);
  if (!detailsRes.success || !detailsRes.stats) {
    return { success: false, error: detailsRes.error || 'Failed to fetch details.' };
  }

  // 3. Calculate eligibility using dynamic import
  const { calculateVerificationEligibility } = await import('@/lib/verification');
  const eligibility = calculateVerificationEligibility(detailsRes.stats);
  const isEligible = eligibility?.isEligible || false;

  if (isEligible) {
    if (!hasVerifiedBadge) {
      badges.push('verified');
      
      const { error } = await supabase
        .from('profiles')
        .update({ badges, verification_source: 'auto' })
        .eq('id', userId);

      if (error) return { success: false, error: error.message };

      // Log in audit logs
      await store.addModerationLog('system', 'auto_verify_user', userId, 'Copies threshold and eligibility criteria met.');
      
      // Notify creator
      await triggerNotification(
        userId,
        null,
        'verification',
        null,
        'Congratulations! Your profile is now automatically verified with a Prizom Creator Badge! 🎖️ You satisfied all platform verification criteria!'
      );
    } else if (currentSource === null) {
      // Set to auto if verified badge exists but source is missing
      await supabase
        .from('profiles')
        .update({ verification_source: 'auto' })
        .eq('id', userId);
    }
  } else {
    if (hasVerifiedBadge) {
      // CRITICAL CHECK: Manual verification must override automatic verification logic!
      if (currentSource === 'manual') {
        // SKIP automatic removal. Do not alter badge or status.
        // Revalidate caches to ensure status badges are up to date
        revalidatePath('/admin/users');
        revalidatePath('/');
        revalidatePath('/discover');
        revalidatePath('/trending');
        if (profile.username) {
          revalidatePath(`/creator/${profile.username}`);
          revalidatePath(`/creator/${profile.username}/analytics`);
        }
        revalidatePath('/prompt/[id]', 'layout');
        return { success: true, message: 'Skipped auto-revocation: creator is manually verified.' };
      }
      
      badges = badges.filter(b => b !== 'verified');
      
      const { error } = await supabase
        .from('profiles')
        .update({ badges, verification_source: null })
        .eq('id', userId);

      if (error) return { success: false, error: error.message };

      // Log in audit logs
      await store.addModerationLog('system', 'auto_unverify_user', userId, 'Creator no longer satisfies verification eligibility criteria.');

      // Notify creator
      await triggerNotification(
        userId,
        null,
        'moderation',
        null,
        'Your verified creator badge has been automatically revoked because account criteria are no longer met.'
      );
    }
  }

  // Revalidate caches if verified status changed
  revalidatePath('/admin/users');
  revalidatePath('/');
  revalidatePath('/discover');
  revalidatePath('/trending');
  if (profile.username) {
    revalidatePath(`/creator/${profile.username}`);
    revalidatePath(`/creator/${profile.username}/analytics`);
  }
  revalidatePath('/prompt/[id]', 'layout');

  return { success: true };
}

export async function getAboutCMS() {
  const currentStore = await store.getStore();
  return {
    success: true,
    about: currentStore.about_settings || {
      platform_mission: "Empowering the next generation of AI artists and creators through a collaborative, visual-first canvas.",
      what_is_prizom: "Prizom is an open collaborative registry for AI prompts. We are a social prompt discovery platform built around endless visual exploration, personalized recommendations, and evolutionary prompt remixing.",
      creator_ecosystem: "A thriving community of prompt creators, digital artists, and generative developers. Share your masterpieces, build a following, and track the genetic lineage of your creative variations.",
      twitter_link: "https://x.com/prizomHQ",
      instagram_link: "https://instagram.com/prizomHQ",
      youtube_link: "https://youtube.com/prizomhq",
      discord_link: "https://discord.gg"
    }
  };
}

export async function updateAboutCMS(settings: Partial<store.AboutSettings>) {
  try {
    const { user: adminUser } = await assertAdminOrAbove();

    const currentStore = await store.getStore();
    currentStore.about_settings = {
      ...currentStore.about_settings!,
      ...settings
    };

    await store.saveStore(currentStore);
    await store.addModerationLog(adminUser.email!, 'update_about_cms', 'settings', 'About Prizom section contents updated.');
    
    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function assignPromptCategoryAction(promptId: string, categoryName: string) {
  try {
    await assertAdminOrAbove();
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from('prompts')
      .update({ category: categoryName })
      .eq('id', promptId);

    if (error) throw error;

    revalidatePath('/admin/prompts');
    revalidatePath('/discover');
    revalidatePath('/');
    revalidatePath(`/prompt/${promptId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Error assigning prompt to category:', err);
    return { success: false, error: err.message || 'Failed to assign prompt category.' };
  }
}
