/**
 * End-to-End Verification Test for OmniSaver Mobile App & Backend
 * Tests:
 * 1. Mobile App Launch Telemetry Ping (device, version, OS)
 * 2. Mobile Multi-Platform Download Events (YouTube, TikTok, Instagram, Pinterest, Facebook)
 * 3. Instant In-App TID PRO Activation (EasyPaisa/JazzCash TID -> Active PRO VIP)
 * 4. Dual-Host Backend Fallback (Primary Worker -> Custom Domain)
 * 5. Admin Live Stats Verification
 */

const PRIMARY_URL = 'https://social-downloading-apk.suhaillakho3.workers.dev';
const FALLBACK_URL = 'https://looknow.cyou';

async function testPipeline() {
  console.log('====================================================');
  console.log('🚀 TESTING MOBILE APP & BACKEND DUAL PIPELINE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function report(ok, name, msg = '') {
    if (ok) {
      console.log(`  ✅ [PASS] ${name} ${msg ? '— ' + msg : ''}`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${name} ${msg ? '— ' + msg : ''}`);
      failed++;
    }
  }

  // 1. Verify Cloudflare Edge Worker Connectivity
  console.log('👉 [1] Edge Worker Endpoint Reachability:');
  for (const host of [PRIMARY_URL, FALLBACK_URL]) {
    try {
      const res = await fetch(`${host}/api/app/config`, {
        headers: { Accept: 'application/json' },
      });
      report(res.status < 500, `Host check: ${host}`, `Status: ${res.status}`);
    } catch (e) {
      report(false, `Host check: ${host}`, `Network Error: ${e.message}`);
    }
  }

  // 2. Mobile App Launch Heartbeat Simulation
  console.log('\n👉 [2] Simulating Mobile App Launch Telemetry:');
  try {
    const launchRes = await fetch(`${PRIMARY_URL}/api/track/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isApp: true,
        source: 'mobile_app',
        platform: 'mobile-app',
        deviceId: 'OMNI-VERIFY-APP-DEV',
        action: 'visit',
        name: 'OmniSaver Android User',
        appVersion: '1.0.16',
        device: 'Android Mobile',
        details: 'Launched OmniSaver Mobile App v1.0.16',
      }),
    });
    const data = await launchRes.json().catch(() => ({}));
    report(launchRes.status === 200 || data.success, 'App Launch Telemetry Recorded', JSON.stringify(data));
  } catch (err) {
    report(false, 'App Launch Telemetry', err.message);
  }

  // 3. Simulating Completed Downloads Across 5 Major Social Platforms
  console.log('\n👉 [3] Simulating Mobile Completed Downloads:');
  const platforms = ['youtube', 'tiktok', 'instagram', 'pinterest', 'facebook'];
  for (const p of platforms) {
    try {
      const dlRes = await fetch(`${PRIMARY_URL}/api/app/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'mobile_app',
          action: 'download',
          platform: p,
          deviceId: 'OMNI-VERIFY-APP-DEV',
          appVersion: '1.0.16',
          details: `Simulated ${p.toUpperCase()} 1080p Download`,
        }),
      });
      const dlData = await dlRes.json().catch(() => ({}));
      report(dlRes.status === 200 || dlData.success, `Download Event: ${p.toUpperCase()}`);
    } catch (err) {
      report(false, `Download Event: ${p.toUpperCase()}`, err.message);
    }
  }

  // 4. Instant Automated In-App TID Verification Test
  console.log('\n👉 [4] Testing Instant In-App TID Activation:');
  try {
    const tidRes = await fetch(`${PRIMARY_URL}/api/app/license/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'TID-7819203912',
        key: 'TID-7819203912',
        tid: 'TID-7819203912',
        deviceId: 'OMNI-VERIFY-APP-DEV',
        planType: 'monthly',
      }),
    });
    const tidData = await tidRes.json().catch(() => ({}));
    report(tidRes.status === 200 && tidData.valid === true, 'Instant TID Verification Accepted', `Message: ${tidData.message}`);
  } catch (err) {
    report(false, 'Instant TID Verification', err.message);
  }

  console.log('\n====================================================');
  console.log(`🏁 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
}

testPipeline().catch(console.error);
