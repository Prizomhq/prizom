import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { dispatchEmail, runEmailRetryQueue } from '@/lib/emailService';
import { safePermanentDelete } from '@/lib/db/user-cleanup';
import { deleteCloudinaryAsset } from '@/lib/cloudinary';

export async function GET(req: NextRequest) {
  // Simple token/secret check (optional query parameter for extra security)
  const authHeader = req.headers.get('authorization');
  const querySecret = req.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || (querySecret !== cronSecret && authHeader !== `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = await createAdminClient();
  const startTime = Date.now();
  let logId = null;

  try {
    // 1. Insert running state
    const { data: runLog, error: logError } = await supabaseAdmin
      .from('cron_runs')
      .insert({
        job_name: 'moderation_cleanup',
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Failed to log cron run start in cron_runs:', logError.message);
    } else {
      logId = runLog?.id;
    }

    // 2. Run moderation cleanup
    const results = await runModerationCleanup();

    // 3. P1-2: Prune expired analytics data (rate_limits, guest_events, prompt_views, prompt_copy_logs)
    let pruneError: string | null = null;
    try {
      const { error: pruneErr } = await supabaseAdmin.rpc('prune_expired_analytics_data');
      if (pruneErr) {
        pruneError = pruneErr.message;
        console.error('[CRON] Analytics pruning failed:', pruneErr.message);
      }
    } catch (e: any) {
      pruneError = e.message;
      console.error('[CRON] Analytics pruning exception:', e);
    }

    // 4. P1-3: Refresh trending prompts cache for all timeframes
    let cacheRefreshError: string | null = null;
    try {
      const { error: cacheErr } = await supabaseAdmin.rpc('refresh_trending_prompts_cache');
      if (cacheErr) {
        cacheRefreshError = cacheErr.message;
        console.error('[CRON] Trending cache refresh failed:', cacheErr.message);
      }
    } catch (e: any) {
      cacheRefreshError = e.message;
      console.error('[CRON] Trending cache refresh exception:', e);
    }

    // 5. Run email retry queue
    const retryResults = await runEmailRetryQueue();

    // Calculate total processed records
    const totalProcessed = 
      (results.userWarningsSent?.length || 0) +
      (results.deletedUsers?.length || 0) +
      (results.promptWarningsSent?.length || 0) +
      (results.archivedPrompts?.length || 0) +
      (results.deletedArchivedPrompts?.length || 0) +
      (retryResults.processed || 0);

    // 6. Log success state
    if (logId) {
      await supabaseAdmin
        .from('cron_runs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          records_processed: totalProcessed
        })
        .eq('id', logId);
    }

    return NextResponse.json({ 
      success: true, 
      results, 
      retryQueue: retryResults,
      pruneError,
      cacheRefreshError
    });
  } catch (err: any) {
    console.error('Moderation cleanup error:', err);
    
    // 5. Log failure state
    if (logId) {
      await supabaseAdmin
        .from('cron_runs')
        .update({
          status: 'failure',
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          error_message: err.stack || err.message
        })
        .eq('id', logId);
    }

    // 6. Send alert email to admins
    try {
      await dispatchEmail('admin@prizom.in', 'admin_notification', {
        subject: 'Moderation Cleanup Cron Failure',
        alertText: `Cron job moderation_cleanup failed with error: ${err.message}\n\nStack Trace:\n${err.stack || ''}`
      });
    } catch (emailErr) {
      console.error('Failed to send admin notification email:', emailErr);
    }

    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function runModerationCleanup() {
  const warningsSent: string[] = [];
  const deletedUsers: string[] = [];

  const supabaseAdmin = await createAdminClient();

  // Process users pending deletion whose scheduled time has passed
  const { data: deletionPendingUsers, error: delPendingError } = await supabaseAdmin
    .from('profiles')
    .select('id, username')
    .eq('pending_deletion', true)
    .lte('scheduled_deletion_at', new Date().toISOString());

  if (delPendingError) {
    console.error('[CRON] Error fetching deletion pending users:', delPendingError.message);
  } else if (deletionPendingUsers && deletionPendingUsers.length > 0) {
    // Process in parallel batches of 5
    const chunkSize = 5;
    for (let i = 0; i < deletionPendingUsers.length; i += chunkSize) {
      const chunk = deletionPendingUsers.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (user) => {
          try {
            console.log(`[CRON] Performing safe permanent delete for pending deletion user: ${user.username} (${user.id})`);
            const res = await safePermanentDelete(user.id);
            if (res.success) {
              deletedUsers.push(user.username);
            } else {
              console.error(`[CRON] Failed to permanently delete user ${user.id}:`, res.error);
            }
          } catch (err) {
            console.error(`[CRON] Exception during permanent delete for user ${user.id}:`, err);
          }
        })
      );
    }
  }

  // Fetch suspended creators
  const { data: suspendedUsers, error: susError } = await supabaseAdmin
    .from('profiles')
    .select('id, username, suspended_at, warning_sent, appeal_status')
    .eq('role', 'suspended');

  if (susError) {
    console.error('Error fetching suspended users from DB:', susError.message);
  } else if (suspendedUsers) {
    for (const user of suspendedUsers) {
      if (!user.suspended_at) continue;

      const suspendedAt = new Date(user.suspended_at);
      const diffTime = Date.now() - suspendedAt.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      let email = `${user.username}@prizom.com`;
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
        if (authUser?.user?.email) {
          email = authUser.user.email;
        }
      } catch (authErr) {
        console.error(`Failed to fetch auth email for suspended user ${user.id}:`, authErr);
      }

      // Day 13 Final Warning (expiring in 2 days)
      if (diffDays >= 13 && diffDays < 15 && !user.warning_sent) {
        if (user.appeal_status !== 'approved') {
          // Send email
          await dispatchEmail(email, 'account_suspended', {
            username: user.username,
            reason: 'Your account has been suspended for 13 days and is scheduled for permanent deletion in 2 days.',
            days: 2
          });

          // Mark as sent in database
          await supabaseAdmin
            .from('profiles')
            .update({ warning_sent: true })
            .eq('id', user.id);

          warningsSent.push(user.username);
        }
      }

      // Day 15+ Permanent Deletion
      if (diffDays >= 15) {
        if (user.appeal_status !== 'approved') {
          // Fetch user's avatar_url and prompt image_urls for Cloudinary cleanup first
          try {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('avatar_url')
              .eq('id', user.id)
              .maybeSingle();
            
            const { data: prompts } = await supabaseAdmin
              .from('prompts')
              .select('image_url')
              .eq('user_id', user.id);
            
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
          } catch (cleanupErr) {
            console.error(`[CLOUDINARY CLEANUP ERROR] Failed to clean user ${user.id} assets:`, cleanupErr);
          }

          // Delete user in Supabase Auth (cascades to profile, prompts, likes, saves, comments, follows)
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          if (deleteError) {
            console.error(`Failed to delete auth user ${user.id}:`, deleteError.message);
            continue; // skip logging if delete failed
          }

          // 2. Log deletion in moderation logs in DB
          await supabaseAdmin
            .from('moderation_logs')
            .insert([{
              moderator_email: 'system@prizom.com',
              action: 'ACCOUNT_DELETED',
              target_id: user.id,
              reason: 'Account permanently deleted after 15 days suspension.'
            }]);

          deletedUsers.push(user.username);
        }
      }
    }
  }

  // Run prompt moderation lifecycle sweeps
  const promptResults = await runPromptModerationCleanup(supabaseAdmin);

  return {
    userWarningsSent: warningsSent,
    deletedUsers,
    promptWarningsSent: promptResults.warningsSent,
    archivedPrompts: promptResults.archivedPrompts,
    deletedArchivedPrompts: promptResults.deletedArchivedPrompts
  };
}

async function runPromptModerationCleanup(supabaseAdmin: any) {
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sixtyDaysTotalAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days in archive, i.e. 60 days total since Day 0

  const warningsSent: string[] = [];
  const archivedPrompts: string[] = [];
  const deletedArchivedPrompts: string[] = [];

  // --- 1. DAY 15 WARNING ALERTS ---
  const { data: pendingWarn, error: warnQueryErr } = await supabaseAdmin
    .from('prompts')
    .select('*, profiles!user_id(username)')
    .eq('moderation_status', 'pending_deletion')
    .eq('warning_sent', false)
    .lte('moderated_at', fifteenDaysAgo);

  if (warnQueryErr) {
    console.error('Error querying prompts for Day 15 warnings:', warnQueryErr.message);
  } else if (pendingWarn) {
    for (const prompt of pendingWarn) {
      // Check if an appeal exists
      const { data: appeal } = await supabaseAdmin
        .from('prompt_appeals')
        .select('status')
        .eq('prompt_id', prompt.id)
        .maybeSingle();

      if (!appeal) {
        const username = prompt.profiles?.username || 'creator';
        let email = `${username}@prizom.com`;
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(prompt.user_id);
          if (authUser?.user?.email) {
            email = authUser.user.email;
          }
        } catch (authErr) {
          console.error(`Failed to fetch auth email for user ${prompt.user_id}:`, authErr);
        }

        // Send warning email
        await dispatchEmail(email, 'prompt_removed', {
          username: username,
          promptTitle: prompt.title,
          reason: 'No appeal has been received. This prompt will be archived in 15 days if no action is taken.'
        });

        // Send platform notification
        await supabaseAdmin
          .from('notifications')
          .insert([{
            user_id: prompt.user_id,
            type: 'moderation',
            entity_id: prompt.id,
            text: `Final warning: Your removed prompt "${prompt.title}" has no appeal submitted. It will be archived in 15 days if no action is taken.`
          }]);

        // Update warning_sent flag
        await supabaseAdmin
          .from('prompts')
          .update({ warning_sent: true })
          .eq('id', prompt.id);

        warningsSent.push(prompt.title);
      }
    }
  }

  // --- 2. DAY 30 ARCHIVE MOVE ---
  const { data: pendingArchive, error: archiveQueryErr } = await supabaseAdmin
    .from('prompts')
    .select('*, profiles!user_id(username)')
    .eq('moderation_status', 'pending_deletion')
    .lte('moderated_at', thirtyDaysAgo);

  if (archiveQueryErr) {
    console.error('Error querying prompts for Day 30 archival:', archiveQueryErr.message);
  } else if (pendingArchive) {
    for (const prompt of pendingArchive) {
      // Check if appeal exists and is NOT approved/pending
      const { data: appeal } = await supabaseAdmin
        .from('prompt_appeals')
        .select('status')
        .eq('prompt_id', prompt.id)
        .maybeSingle();

      const hasActiveAppeal = appeal && (appeal.status === 'approved' || appeal.status === 'pending');

      if (!hasActiveAppeal) {
        const username = prompt.profiles?.username || 'creator';
        let email = `${username}@prizom.com`;
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(prompt.user_id);
          if (authUser?.user?.email) {
            email = authUser.user.email;
          }
        } catch (authErr) {
          console.error(`Failed to fetch auth email for user ${prompt.user_id}:`, authErr);
        }

        // Call the database function to atomically archive the prompt in a transaction
        const { data: archiveSuccess, error: rpcErr } = await supabaseAdmin
          .rpc('archive_prompt_lifecycle', { target_prompt_id: prompt.id });

        if (rpcErr || !archiveSuccess) {
          console.error(`Failed to execute transactional archive for prompt ${prompt.id}:`, rpcErr?.message || 'Archival failed.');
          continue;
        }

        // Send archival notification and email
        await dispatchEmail(email, 'prompt_removed', {
          username: username,
          promptTitle: prompt.title,
          reason: 'Moved to archives after 30 days without a successful appeal. Will be permanently deleted in 30 days.'
        });

        await supabaseAdmin
          .from('notifications')
          .insert([{
            user_id: prompt.user_id,
            type: 'moderation',
            entity_id: null,
            text: `Your removed prompt "${prompt.title}" has been archived and will be permanently deleted in 30 days.`
          }]);

        archivedPrompts.push(prompt.title);
      }
    }
  }

  // --- 3. DAY 60 HARD DELETE ---
  const { data: expiredArchives, error: deleteArchiveErr } = await supabaseAdmin
    .from('archived_prompts')
    .delete()
    .lte('archived_at', sixtyDaysTotalAgo)
    .select('id, title, image_url');

  if (deleteArchiveErr) {
    console.error('Error hard-deleting expired archived prompts:', deleteArchiveErr.message);
  } else if (expiredArchives) {
    const { deleteCloudinaryAsset } = await import('@/lib/cloudinary');
    for (const p of expiredArchives) {
      deletedArchivedPrompts.push(p.title);
      if (p.image_url) {
        try {
          await deleteCloudinaryAsset(p.image_url);
        } catch (assetErr) {
          console.error(`[CLOUDINARY CLEANUP ERROR] Failed to delete archived prompt image ${p.id}:`, assetErr);
        }
      }
    }
  }

  return {
    warningsSent,
    archivedPrompts,
    deletedArchivedPrompts
  };
}
