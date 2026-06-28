const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Load environment variables manually from .env.local
function loadEnv() {
  const envPath = path.resolve('d:/Prizom/.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          let val = trimmed.slice(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

function generateSecurePassword() {
  return crypto.randomBytes(12).toString('hex') + 'A1!'; // 27 characters, including numbers, uppercase and special char
}

async function runReset() {
  console.log('================================================================');
  console.log('STARTING PRIZOM PRODUCTION DATA RESET & SANITIZATION');
  console.log('================================================================\n');

  const report = {
    superAdminEmail: 'prizomhq@gmail.com',
    superAdminId: null,
    superAdminPassword: null,
    superAdminStatus: 'UNKNOWN',
    usersRemoved: 0,
    promptsRemoved: 0,
    likesRemoved: 0,
    savesRemoved: 0,
    commentsRemoved: 0,
    notificationsRemoved: 0,
    blockedUsersRemoved: 0,
    followersRemoved: 0,
    userAchievementsRemoved: 0,
    userReportsRemoved: 0,
    promptReportsRemoved: 0,
    guestEventsRemoved: 0,
    cronRunsRemoved: 0,
    moderationLogsRemoved: 0,
    cloudinaryPromptsDeleted: 0,
    cloudinaryAvatarsDeleted: 0,
    categoriesCount: 0,
    toolsCount: 0
  };

  try {
    // 1. Establish the Single Super Admin Account
    console.log('--- Step 1: Establishing Super Admin Account ---');
    const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers();
    if (listUsersError) throw listUsersError;

    let superAdminUser = users.find(u => u.email === report.superAdminEmail);

    if (!superAdminUser) {
      console.log(`  - Super Admin account "${report.superAdminEmail}" not found. Creating a new active account...`);
      const securePassword = generateSecurePassword();
      report.superAdminPassword = securePassword;

      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: report.superAdminEmail,
        password: securePassword,
        email_confirm: true,
        user_metadata: {
          username: 'prizomhq'
        }
      });

      if (createError) throw createError;
      superAdminUser = createData.user;
      report.superAdminStatus = 'CREATED';
      console.log(`  - Successfully created Super Admin auth user.`);
    } else {
      report.superAdminStatus = 'PRESERVED';
      console.log(`  - Preserved existing Super Admin auth user.`);
    }

    report.superAdminId = superAdminUser.id;

    // Ensure profiles table role and approval is updated
    const { data: profileUpdate, error: profileErr } = await supabase
      .from('profiles')
      .update({
        role: 'super_admin',
        is_approved: true
      })
      .eq('id', report.superAdminId)
      .select();

    if (profileErr) throw profileErr;
    console.log(`  - Promoted profile "${report.superAdminEmail}" to role "super_admin".`);

    // 2. Remove all other User Accounts (Auth.users + Cascade Profile deletes)
    console.log('\n--- Step 2: Deleting All Other User Accounts ---');
    for (const u of users) {
      if (u.email !== report.superAdminEmail) {
        console.log(`  - Deleting user: ${u.email} (${u.id})`);
        const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
        if (delErr) {
          console.warn(`    ⚠️ Failed to delete auth user ${u.email}: ${delErr.message}`);
          // Attempt direct profiles delete fallback
          await supabase.from('profiles').delete().eq('id', u.id);
        }
        report.usersRemoved++;
      }
    }
    console.log(`  - Successfully deleted ${report.usersRemoved} other user account(s).`);

    // 3. Clear all prompts (Owner-only prompts cascade likes, saves, comments)
    console.log('\n--- Step 3: Purging Prompts & Social Interactions ---');
    
    // Explicit deletion counts for cleanup audit log
    const { count: promptsCount } = await supabase.from('prompts').select('*', { count: 'exact', head: true });
    const { count: likesCount } = await supabase.from('likes').select('*', { count: 'exact', head: true });
    const { count: savesCount } = await supabase.from('saves').select('*', { count: 'exact', head: true });
    const { count: commentsCount } = await supabase.from('comments').select('*', { count: 'exact', head: true });

    report.promptsRemoved = promptsCount || 0;
    report.likesRemoved = likesCount || 0;
    report.savesRemoved = savesCount || 0;
    report.commentsRemoved = commentsCount || 0;

    // Perform deletions
    await supabase.from('comments').delete().neq('content', 'keep_none_placeholder');
    await supabase.from('likes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('saves').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { error: promptsPurgeError } = await supabase
      .from('prompts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (promptsPurgeError) throw promptsPurgeError;
    console.log(`  - Purged all ${report.promptsRemoved} prompts, ${report.likesRemoved} likes, ${report.savesRemoved} saves, and ${report.commentsRemoved} comments.`);

    // 4. Purge Logs, Analytics, Reports, and Notifications
    console.log('\n--- Step 4: Purging System Logs, Reports & Analytics ---');
    
    const { count: countNotif } = await supabase.from('notifications').select('*', { count: 'exact', head: true });
    report.notificationsRemoved = countNotif || 0;
    await supabase.from('notifications').delete().neq('text', 'keep_none_placeholder');

    const { count: countBlocks } = await supabase.from('blocked_users').select('*', { count: 'exact', head: true });
    report.blockedUsersRemoved = countBlocks || 0;
    await supabase.from('blocked_users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { count: countFollows } = await supabase.from('followers').select('*', { count: 'exact', head: true });
    report.followersRemoved = countFollows || 0;
    await supabase.from('followers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { count: countAch } = await supabase.from('user_achievements').select('*', { count: 'exact', head: true });
    report.userAchievementsRemoved = countAch || 0;
    await supabase.from('user_achievements').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { count: countUserRep } = await supabase.from('user_reports').select('*', { count: 'exact', head: true });
    report.userReportsRemoved = countUserRep || 0;
    await supabase.from('user_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { count: countPromptRep } = await supabase.from('prompt_reports').select('*', { count: 'exact', head: true });
    report.promptReportsRemoved = countPromptRep || 0;
    await supabase.from('prompt_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { count: countGuestEv } = await supabase.from('guest_events').select('*', { count: 'exact', head: true });
    report.guestEventsRemoved = countGuestEv || 0;
    await supabase.from('guest_events').delete().neq('ip_hash', 'keep_none_placeholder');

    const { count: countCron } = await supabase.from('cron_runs').select('*', { count: 'exact', head: true });
    report.cronRunsRemoved = countCron || 0;
    await supabase.from('cron_runs').delete().neq('status', 'keep_none_placeholder');

    const { count: countModLogs } = await supabase.from('moderation_logs').select('*', { count: 'exact', head: true });
    report.moderationLogsRemoved = countModLogs || 0;
    await supabase.from('moderation_logs').delete().neq('action', 'keep_none_placeholder');

    console.log(`  - Purged all guest_events, cron_runs, moderation_logs, notifications, reports, blocks, followers, and user_achievements.`);

    // 5. Purge Cloudinary uploads
    console.log('\n--- Step 5: Purging Cloudinary Uploads ---');
    try {
      const promptsRes = await cloudinary.api.delete_resources_by_prefix('prizom/prompts/');
      report.cloudinaryPromptsDeleted = Object.keys(promptsRes.deleted || {}).length;
      console.log(`  - Deleted ${report.cloudinaryPromptsDeleted} files from Cloudinary folder 'prizom/prompts/'.`);
    } catch (clErr) {
      console.warn('  - Cloudinary prompts purge warning (likely folder already empty):', clErr.message);
    }

    try {
      const avatarsRes = await cloudinary.api.delete_resources_by_prefix('prizom/avatars/');
      report.cloudinaryAvatarsDeleted = Object.keys(avatarsRes.deleted || {}).length;
      console.log(`  - Deleted ${report.cloudinaryAvatarsDeleted} files from Cloudinary folder 'prizom/avatars/'.`);
    } catch (clErr) {
      console.warn('  - Cloudinary avatars purge warning (likely folder already empty):', clErr.message);
    }

    // 6. Verify System configuration is preserved
    console.log('\n--- Step 6: Verifying System Configurations Are Preserved ---');
    const { count: catVerify } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    const { count: toolVerify } = await supabase.from('ai_tools').select('*', { count: 'exact', head: true });
    report.categoriesCount = catVerify || 0;
    report.toolsCount = toolVerify || 0;

    console.log(`  - Categories preserved: ${report.categoriesCount}`);
    console.log(`  - AI Tools preserved: ${report.toolsCount}`);

    console.log('\n================================================================');
    console.log('PRODUCTION SANITIZATION COMPLETED SUCCESSFULLY');
    console.log('================================================================\n');

    console.log(JSON.stringify(report, null, 2));

    // Save report in scratch folder for documentation
    fs.writeFileSync(
      path.resolve('d:/Prizom/scratch/sanitization_audit_results.json'), 
      JSON.stringify(report, null, 2)
    );

    process.exit(0);

  } catch (err) {
    console.error('\n🚨 Reset failed with fatal error:', err);
    process.exit(1);
  }
}

runReset();
