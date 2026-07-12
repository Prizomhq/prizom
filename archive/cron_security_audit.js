/**
 * Prizom P0 Cron Security & Lifecycle Validation Audit
 * Tests secret authorization and the 15/30/60 day moderation sweeps.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = '';
let supabaseServiceKey = '';
let cronSecret = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = val;
      if (key === 'CRON_SECRET') cronSecret = val;
    }
  }
} catch (err) {
  console.error('Error reading or parsing .env.local:', err.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey || !cronSecret) {
  console.error('Missing required variables in .env.local');
  process.exit(1);
}

// Expose env variables to process.env for the route handler
process.env.CRON_SECRET = cronSecret;
process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
process.env.SUPABASE_SERVICE_ROLE_KEY = supabaseServiceKey;

// Load Supabase Admin Client
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Mock NextRequest creator
function createMockRequest(authHeaderVal, querySecretVal) {
  return {
    headers: {
      get: (name) => {
        if (name.toLowerCase() === 'authorization') return authHeaderVal;
        return null;
      }
    },
    nextUrl: {
      searchParams: {
        get: (name) => {
          if (name === 'secret') return querySecretVal;
          return null;
        }
      }
    }
  };
}

async function runCronAudit() {
  console.log('\n==================================================');
  console.log('STARTING PRIZOM CRON SECURITY & LIFECYCLE AUDIT');
  console.log('==================================================\n');

  let testUserWarn = null;
  let testUserDelete = null;
  let promptWarnId = null;
  let promptArchiveId = null;
  let promptDeleteId = '6c7b9e8a-a1b2-c3d4-e5f6-7890abcdef12'; // static UUID for archive test

  let results = {
    unauthorizedBlock: 'FAIL',
    authorizedSuccess: 'FAIL',
    day15Warning: 'FAIL',
    day30Archive: 'FAIL',
    day60Delete: 'FAIL'
  };

  try {
    // Load GET handler from API route using tsx compiler loader
    const { GET } = require('../src/app/api/cron/cleanup/route.ts');

    // --- 1. TEST CRON AUTHORIZATION SECURITY ---
    console.log('--- Test 1: Security Authorization Check ---');

    // 1a. Unauthorized Request (no secret)
    const reqUnauth = createMockRequest(null, null);
    const resUnauth = await GET(reqUnauth);
    const bodyUnauth = await resUnauth.json();

    if (resUnauth.status === 401 && bodyUnauth.error === 'Unauthorized') {
      console.log('  [PASS] Request with no secret returns 401 Unauthorized.');
      results.unauthorizedBlock = 'PASS';
    } else {
      console.error('  [FAIL] Unauthorized request bypassed security!', resUnauth.status, bodyUnauth);
    }

    // 1b. Unauthorized Request (wrong secret)
    const reqWrong = createMockRequest('Bearer wrong_secret', null);
    const resWrong = await GET(reqWrong);
    if (resWrong.status === 401) {
      console.log('  [PASS] Request with wrong secret returns 401.');
    } else {
      console.error('  [FAIL] Request with wrong secret was not blocked.');
    }

    // --- 2. SEED SECTIONS FOR LIFECYCLE SWEEPS ---
    console.log('\n--- Seeding Transient Test Lifecycle Records ---');

    // Query an active invite key to bypass the signup trigger restriction
    const { data: keyData } = await adminClient
      .from('invite_keys')
      .select('key')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    const inviteKey = keyData?.key || 'prizom-beta-8x4f';

    // User A: Suspended 14 days ago (triggers Day 13 warning, warning_sent = false)
    const emailWarn = `cron_warn_${Date.now()}@prizom.com`;
    const { data: authWarn } = await adminClient.auth.admin.createUser({
      email: emailWarn,
      password: 'Password123!',
      email_confirm: true,
      user_metadata: { invite_key: inviteKey }
    });
    testUserWarn = authWarn.user;
    
    // Ensure profiles trigger finishes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const warnSuspendedAt = new Date();
    warnSuspendedAt.setDate(warnSuspendedAt.getDate() - 14);
    await adminClient.from('profiles').update({
      username: `cron_warn_usr_${Math.floor(Math.random() * 1000)}`,
      role: 'suspended',
      suspended_at: warnSuspendedAt.toISOString(),
      warning_sent: false
    }).eq('id', testUserWarn.id);

    // User B: Suspended 16 days ago (triggers Day 15 deletion)
    const emailDel = `cron_del_${Date.now()}@prizom.com`;
    const { data: authDel } = await adminClient.auth.admin.createUser({
      email: emailDel,
      password: 'Password123!',
      email_confirm: true,
      user_metadata: { invite_key: inviteKey }
    });
    testUserDelete = authDel.user;
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    const delSuspendedAt = new Date();
    delSuspendedAt.setDate(delSuspendedAt.getDate() - 16);
    await adminClient.from('profiles').update({
      username: `cron_del_usr_${Math.floor(Math.random() * 1000)}`,
      role: 'suspended',
      suspended_at: delSuspendedAt.toISOString(),
      warning_sent: false
    }).eq('id', testUserDelete.id);

    // Prompt A: Moderated 16 days ago (triggers Day 15 warning, warning_sent = false)
    const warnModAt = new Date();
    warnModAt.setDate(warnModAt.getDate() - 16);
    const { data: promptW } = await adminClient.from('prompts').insert({
      user_id: testUserWarn.id,
      title: 'Prompt Day 15 Warning Test',
      prompt_text: 'Generative test template',
      ai_tool: 'Flux',
      category: 'realistic',
      moderation_status: 'pending_deletion',
      moderated_at: warnModAt.toISOString(),
      warning_sent: false
    }).select('id').single();
    promptWarnId = promptW.id;

    // Prompt B: Moderated 31 days ago (triggers Day 30 archive)
    const archModAt = new Date();
    archModAt.setDate(archModAt.getDate() - 31);
    const { data: promptA } = await adminClient.from('prompts').insert({
      user_id: testUserWarn.id,
      title: 'Prompt Day 30 Archival Test',
      prompt_text: 'Generative test template',
      ai_tool: 'Flux',
      category: 'realistic',
      moderation_status: 'pending_deletion',
      moderated_at: archModAt.toISOString(),
      warning_sent: true
    }).select('id').single();
    promptArchiveId = promptA.id;

    // Archived Prompt C: Archived 31 days ago (triggers Day 60 hard delete)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 31); // 31 days inside archive
    
    // Inject directly into archived_prompts
    await adminClient.from('archived_prompts').insert({
      id: promptDeleteId,
      user_id: testUserWarn.id,
      creator_username: 'cron_warn_usr',
      creator_email: emailWarn,
      title: 'Prompt Day 60 Hard Delete Test',
      prompt_text: 'Generative test template',
      ai_tool: 'Flux',
      category: 'realistic',
      archived_at: sixtyDaysAgo.toISOString()
    });

    console.log('[INFO] Test records seeded. Triggering cron execution...');

    // --- 3. EXECUTE CRON ROUTE ---
    const reqAuth = createMockRequest('Bearer ' + cronSecret, null);
    const resAuth = await GET(reqAuth);
    const bodyAuth = await resAuth.json();

    if (resAuth.status === 200 && bodyAuth.success === true) {
      console.log('  [PASS] Authorized request succeeded (returned 200).');
      results.authorizedSuccess = 'PASS';
    } else {
      console.error('  [FAIL] Authorized request failed!', resAuth.status, bodyAuth);
    }

    // --- 4. VERIFY LIFECYCLE OUTCOMES ---
    console.log('\n--- Test 3: Lifecycle Sweeps Verification ---');

    // 4a. Verify User Warning (warning_sent = true)
    const { data: checkWarnUser } = await adminClient.from('profiles').select('warning_sent').eq('id', testUserWarn.id).single();
    if (checkWarnUser && checkWarnUser.warning_sent === true) {
      console.log('  [PASS] Day 13/15 User Warning sent successfully.');
    } else {
      console.error('  [FAIL] Day 13/15 User Warning was not sent.');
    }

    // 4b. Verify User Deletion
    const { data: checkDelUser } = await adminClient.from('profiles').select('role').eq('id', testUserDelete.id).maybeSingle();
    if (!checkDelUser) {
      console.log('  [PASS] Day 15+ suspended user permanently deleted from database.');
    } else {
      console.error('  [FAIL] Day 15+ suspended user still exists in database.', checkDelUser);
    }

    // 4c. Verify Prompt Warning (warning_sent = true)
    const { data: checkWarnPrompt } = await adminClient.from('prompts').select('warning_sent').eq('id', promptWarnId).single();
    if (checkWarnPrompt && checkWarnPrompt.warning_sent === true) {
      console.log('  [PASS] Day 15 Prompt warning sent successfully.');
      results.day15Warning = 'PASS';
    } else {
      console.error('  [FAIL] Day 15 Prompt warning was not sent.', checkWarnPrompt);
    }

    // 4d. Verify Prompt Archival
    const { data: checkArchPrompt } = await adminClient.from('prompts').select('*').eq('id', promptArchiveId).maybeSingle();
    const { data: checkArchExists } = await adminClient.from('archived_prompts').select('*').eq('id', promptArchiveId).maybeSingle();
    
    if (!checkArchPrompt && checkArchExists) {
      console.log('  [PASS] Day 30 Prompt atomically archived (deleted from prompts, inserted in archived_prompts).');
      results.day30Archive = 'PASS';
    } else {
      console.error('  [FAIL] Day 30 Prompt archival failed.', { promptsTable: checkArchPrompt, archivesTable: checkArchExists });
    }

    // 4e. Verify Prompt Deletion
    const { data: checkDelPrompt } = await adminClient.from('archived_prompts').select('*').eq('id', promptDeleteId).maybeSingle();
    if (!checkDelPrompt) {
      console.log('  [PASS] Day 60 Archived prompt permanently deleted.');
      results.day60Delete = 'PASS';
    } else {
      console.error('  [FAIL] Day 60 Archived prompt still exists.', checkDelPrompt);
    }

  } catch (err) {
    console.error('\n[EXCEPTION ENCOUNTERED DURING CRON AUDIT]:', err.message, err.stack);
  } finally {
    // --- CLEANUP ---
    console.log('\nCleaning up seeded test cron records...');
    if (promptWarnId) await adminClient.from('prompts').delete().eq('id', promptWarnId);
    if (promptArchiveId) {
      await adminClient.from('prompts').delete().eq('id', promptArchiveId);
      await adminClient.from('archived_prompts').delete().eq('id', promptArchiveId);
    }
    await adminClient.from('archived_prompts').delete().eq('id', promptDeleteId);
    if (testUserWarn) await adminClient.auth.admin.deleteUser(testUserWarn.id);
    if (testUserDelete) await adminClient.auth.admin.deleteUser(testUserDelete.id);
    console.log('[INFO] Cleanup completed successfully.');
  }

  console.log('\n==================================================');
  console.log('CRON SECURITY & LIFECYCLE AUDIT SUMMARY');
  console.log('==================================================');
  const allPass = Object.values(results).every(r => r === 'PASS');
  for (const [key, status] of Object.entries(results)) {
    console.log(`${key.padEnd(25)}: ${status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
  }
  console.log('==================================================');
  console.log(`OVERALL STATUS            : ${allPass ? 'PASS' : 'FAIL'}`);
  console.log('==================================================\n');

  process.exit(allPass ? 0 : 1);
}

runCronAudit();
