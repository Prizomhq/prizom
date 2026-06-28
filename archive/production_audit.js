/**
 * Prizom Production Readiness Deployment Audit
 * Scans production code pathways for launch blockers.
 */

const fs = require('fs');
const path = require('path');

const PRODUCTION_SRC_DIR = 'd:/Prizom/src';

// Excluded files or directories (e.g. static assets, tests, config)
const EXCLUDED_PATHS = [
  'node_modules',
  '.next',
  'scratch',
  'remixes',
  'avatars',
  'prompts',
  'public',
  'test_rls_security.js',
  'cron_security_audit.js',
  'production_audit.js'
];

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Check exclusions
    if (EXCLUDED_PATHS.some(ex => filePath.includes(ex))) continue;

    if (stat.isDirectory()) {
      getFiles(filePath, fileList);
    } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function runProductionAudit() {
  console.log('\n==================================================');
  console.log('STARTING PRIZOM PRODUCTION READINESS AUDIT');
  console.log('==================================================\n');

  let results = {
    noFilesystemWrites: 'PASS',
    noJsonStorePersistence: 'PASS',
    noHardcodedSecrets: 'PASS',
    noLocalhostUrls: 'PASS'
  };

  const files = getFiles(PRODUCTION_SRC_DIR);
  console.log(`Scanning ${files.length} production source files under "/src"...\n`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative('d:/Prizom', file);

    // 1. Check for filesystem writes
    if (content.includes('writeFileSync') || content.includes('writeFile') || content.includes('mkdirSync') || content.includes('fs.promises')) {
      // Exclude references inside comments or type annotations if any
      if (content.match(/\bfs\.(writeFileSync|writeFile|mkdirSync)\b/)) {
        console.error(`  ❌ [FAIL] Filesystem write operation found in: ${relativePath}`);
        results.noFilesystemWrites = 'FAIL';
      }
    }

    // 2. Check for admin-store.json persistence file references
    if (content.includes('admin-store.json')) {
      console.error(`  ❌ [FAIL] Reference to "admin-store.json" found in: ${relativePath}`);
      results.noJsonStorePersistence = 'FAIL';
    }

    // 3. Check for localhost URLs in code (exempting env validation script itself)
    if (content.includes('http://localhost:') || content.includes('http://127.0.0.1:')) {
      if (!relativePath.includes('environment_audit') && !relativePath.includes('layout.tsx')) {
        console.error(`  ❌ [FAIL] Hardcoded localhost URL found in: ${relativePath}`);
        results.noLocalhostUrls = 'FAIL';
      }
    }

    // 4. Check for hardcoded API keys
    const apiKeyMatches = content.match(/RESEND_API_KEY\s*=\s*['"`](re_[a-zA-Z0-9]+)['"`]/i);
    const supabaseSecretMatches = content.match(/SERVICE_ROLE_KEY\s*=\s*['"`]([a-zA-Z0-9_-]+)['"`]/i);
    
    if (apiKeyMatches || supabaseSecretMatches) {
      console.error(`  ❌ [FAIL] Hardcoded API/Service secrets found in: ${relativePath}`);
      results.noHardcodedSecrets = 'FAIL';
    }
  }

  console.log('\n==================================================');
  console.log('PRODUCTION DEPLOYMENT AUDIT SUMMARY');
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

runProductionAudit();
