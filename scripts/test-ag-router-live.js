const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Manual env loader
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  });
} catch (_) {}

const AG_ROUTER_BASE_URL = process.env.AG_ROUTER_BASE_URL || 'https://api.prizom.in/v1';
const AG_ROUTER_API_KEY = process.env.AG_ROUTER_API_KEY || 'pr_live_prizom_studio_key_2026_prod';
const AG_ROUTER_HMAC_SECRET = process.env.AG_ROUTER_HMAC_SECRET;

function generateHMACSignature(pathStr, bodyString, timestamp, nonce, secret) {
  const message = `${pathStr}:${bodyString}:${timestamp}:${nonce}`;
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

async function testLiveAGRouter() {
  console.log('====================================================');
  console.log('AG ROUTER LIVE PRODUCTION CONNECTION TEST');
  console.log('====================================================');
  console.log('Target Base URL:', AG_ROUTER_BASE_URL);
  console.log('API Key Prefix:', AG_ROUTER_API_KEY.slice(0, 8) + '...');
  
  const testPath = '/v1/vision/analyze';
  const requestId = crypto.randomUUID();
  const sampleImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';

  const body = {
    requestId,
    operation: 'image_to_prompt',
    image_url: sampleImageUrl,
    imageUrl: sampleImageUrl,
    analysis_type: 'full',
    context: { platform: 'prizom', version: 'v3-hybrid' },
    qualityLevel: 'premium'
  };

  const bodyString = JSON.stringify(body);
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = generateHMACSignature(testPath, bodyString, timestamp, nonce, AG_ROUTER_HMAC_SECRET);

  const normalizedBase = AG_ROUTER_BASE_URL.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
  const requestUrl = `${normalizedBase}${testPath}`;

  console.log('Dispatching request to:', requestUrl);

  try {
    const res = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AG_ROUTER_API_KEY}`,
        'X-Prizom-Signature': signature,
        'X-Prizom-Timestamp': timestamp.toString(),
        'X-Prizom-Nonce': nonce
      },
      body: bodyString,
      signal: AbortSignal.timeout(15000)
    });

    console.log('HTTP Status Code:', res.status);

    if (res.ok) {
      const data = await res.json();
      console.log('\n[SUCCESS] Live Response Received from AG Router!');
      console.log('Returned Model:', data.model || data.provider || 'AG Router Multi-Provider');
      console.log('Prompt Output Snippet:', (data.prompt?.main || data.prompt || data.analysis?.subject || JSON.stringify(data)).slice(0, 150) + '...');
      console.log('\nResult: AG ROUTER IS 100% ONLINE AND WORKING PERFECTLY WITH AI STUDIO!');
    } else {
      const errText = await res.text();
      console.error('AG Router returned status:', res.status, errText);
    }
  } catch (err) {
    console.error('Connection error:', err.message);
  }
}

testLiveAGRouter();
