import { generatePromptFromImage } from '../src/lib/ai-studio/client';
import { execute14StageVisionPipeline } from '../src/lib/ai-studio/vision-pipeline';

async function runAgRouterArchitectureTests() {
  console.log('====================================================');
  console.log('AG ROUTER MANDATORY GATEWAY ARCHITECTURE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Direct Vision Pipeline Bypass Attempt (MUST FAIL CLOSED)
  console.log('[TEST 1] Testing Direct Local Vision Pipeline Execution...');
  try {
    await execute14StageVisionPipeline('https://images.unsplash.com/photo-1579783902614-a3fb3927b675');
    console.error('❌ TEST 1 FAILED: Direct vision pipeline allowed execution without AG Router!');
    failed++;
  } catch (err: any) {
    if (err.message.includes('bypass detected') || err.message.includes('AG Router')) {
      console.log('✅ TEST 1 PASSED: Direct vision pipeline blocked cleanly with error:', err.message);
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED: Unexpected error message:', err.message);
      failed++;
    }
  }

  // Test 2: AG Router Offline / Unreachable Endpoint (MUST FAIL CLOSED)
  console.log('\n[TEST 2] Testing AG Router Offline / Unreachable Endpoint...');
  const originalUrl = process.env.AG_ROUTER_BASE_URL;
  process.env.AG_ROUTER_BASE_URL = 'http://127.0.0.1:59999/v1'; // Invalid offline port

  try {
    const testImage = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675';
    await generatePromptFromImage(testImage, { requestId: 'test_offline_req_123' });
    console.error('❌ TEST 2 FAILED: Generation succeeded while AG Router was offline! Bypass path present!');
    failed++;
  } catch (err: any) {
    if (
      err.message.includes('AI generation is temporarily unavailable') ||
      err.message.includes('AG Router') ||
      err.message.includes('fetch failed') ||
      err.message.includes('connection failed')
    ) {
      console.log('✅ TEST 2 PASSED: AG Router offline request failed closed cleanly with error:', err.message);
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: Unexpected error message:', err.message);
      failed++;
    }
  } finally {
    process.env.AG_ROUTER_BASE_URL = originalUrl;
  }

  // Test 3: AG Router Unconfigured / Missing Base URL (MUST FAIL CLOSED)
  console.log('\n[TEST 3] Testing AG Router Gateway Unconfigured...');
  process.env.AG_ROUTER_BASE_URL = '';

  try {
    await generatePromptFromImage('https://images.unsplash.com/photo-1579783902614-a3fb3927b675');
    console.error('❌ TEST 3 FAILED: Generation succeeded while AG Router was unconfigured!');
    failed++;
  } catch (err: any) {
    if (err.message.includes('Gateway configuration missing')) {
      console.log('✅ TEST 3 PASSED: Unconfigured AG Router request failed closed with error:', err.message);
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED: Unexpected error message:', err.message);
      failed++;
    }
  } finally {
    process.env.AG_ROUTER_BASE_URL = originalUrl;
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAgRouterArchitectureTests();
