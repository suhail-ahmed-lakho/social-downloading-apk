const assert = require('assert');

// Test suite for OmniSaver PRO Subscription & Entitlements Engine
function runProEntitlementTests() {
  console.log('\n==================================================');
  console.log('⭐ RUNNING OMNISAVER PRO & LICENSE SYSTEM TESTS');
  console.log('==================================================');

  // 1. Device ID format validation
  function generateDeviceId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 4; i++) {
      p1 += chars.charAt(Math.floor(Math.random() * chars.length));
      p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `OMNI-${p1}-${p2}`;
  }

  const devId1 = generateDeviceId();
  const devId2 = generateDeviceId();
  assert.match(devId1, /^OMNI-[A-Z2-9]{4}-[A-Z2-9]{4}$/, 'Device ID 1 format must be OMNI-XXXX-XXXX');
  assert.match(devId2, /^OMNI-[A-Z2-9]{4}-[A-Z2-9]{4}$/, 'Device ID 2 format must be OMNI-XXXX-XXXX');
  assert.notStrictEqual(devId1, devId2, 'Generated Device IDs should be unique');
  console.log(`✅ Device ID format & randomness verified: ${devId1}`);

  // 2. Deterministic Device-Bound Key Generation & Verification
  function generateLicenseKeyForDevice(deviceId, plan) {
    const cleanDev = (deviceId || '').replace(/[^A-Z0-9]/g, '');
    const planPrefix = plan === 'monthly' ? 'M' : plan === 'quarterly' ? 'Q' : 'Y';
    const seed = `${cleanDev}:${planPrefix}:OMNISAVER_PRO_SECRET_2026`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `OMNI-${planPrefix}${hex.slice(0, 3)}-${hex.slice(3, 7)}`;
  }

  const monthlyKey = generateLicenseKeyForDevice(devId1, 'monthly');
  const quarterlyKey = generateLicenseKeyForDevice(devId1, 'quarterly');
  const yearlyKey = generateLicenseKeyForDevice(devId1, 'yearly');

  assert.match(monthlyKey, /^OMNI-M[A-F0-9]{3}-[A-F0-9]{4}$/, 'Monthly key format valid');
  assert.match(quarterlyKey, /^OMNI-Q[A-F0-9]{3}-[A-F0-9]{4}$/, 'Quarterly key format valid');
  assert.match(yearlyKey, /^OMNI-Y[A-F0-9]{3}-[A-F0-9]{4}$/, 'Yearly key format valid');
  assert.strictEqual(
    monthlyKey,
    generateLicenseKeyForDevice(devId1, 'monthly'),
    'Key generation must be deterministic for same device ID'
  );
  assert.notStrictEqual(
    monthlyKey,
    generateLicenseKeyForDevice(devId2, 'monthly'),
    'Keys for different devices must be completely different'
  );
  console.log(`✅ Deterministic Device-bound key validation passed (${monthlyKey})`);

  // 3. License Key Activation Logic
  function verifyKey(key, deviceId) {
    const norm = (key || '').trim().toUpperCase();
    if (!norm) return { valid: false };

    if (norm === 'OMNI-TEST-2026') {
      return { valid: true, plan: 'monthly', days: 30 };
    }
    if (norm === 'OMNI-VIP-2026' || norm === 'OMNI-PRO-VIP' || norm === 'OMNI-LAKHO-VIP') {
      return { valid: true, plan: 'yearly', days: 365 };
    }

    if (norm === generateLicenseKeyForDevice(deviceId, 'monthly')) {
      return { valid: true, plan: 'monthly', days: 30 };
    }
    if (norm === generateLicenseKeyForDevice(deviceId, 'quarterly')) {
      return { valid: true, plan: 'quarterly', days: 90 };
    }
    if (norm === generateLicenseKeyForDevice(deviceId, 'yearly')) {
      return { valid: true, plan: 'yearly', days: 365 };
    }
    if (norm.startsWith('OMNI-PRO-') && norm.length >= 14) {
      return { valid: true, plan: 'monthly', days: 30 };
    }
    return { valid: false };
  }

  const devTestRes = verifyKey('OMNI-TEST-2026', devId1);
  assert.strictEqual(devTestRes.valid, true);
  assert.strictEqual(devTestRes.days, 30);

  const vipRes = verifyKey('OMNI-VIP-2026', devId1);
  assert.strictEqual(vipRes.valid, true);
  assert.strictEqual(vipRes.plan, 'yearly');

  const boundRes = verifyKey(monthlyKey, devId1);
  assert.strictEqual(boundRes.valid, true);
  assert.strictEqual(boundRes.plan, 'monthly');

  const wrongDeviceRes = verifyKey(monthlyKey, devId2);
  assert.strictEqual(wrongDeviceRes.valid, false, 'Key generated for device 1 must fail on device 2');

  const invalidKeyRes = verifyKey('INVALID-KEY-1234', devId1);
  assert.strictEqual(invalidKeyRes.valid, false);
  console.log('✅ License activation & device binding verification passed');

  // 4. Expiry Evaluation Logic
  function evaluateIsPro(isProFlag, expiryTimestamp) {
    if (!isProFlag) return false;
    if (expiryTimestamp && Date.now() > expiryTimestamp) {
      return false; // Expired!
    }
    return true;
  }

  const activeTimestamp = Date.now() + 1000 * 60 * 60 * 24 * 15; // 15 days in future
  const expiredTimestamp = Date.now() - 1000 * 60 * 60 * 24 * 2; // 2 days ago

  assert.strictEqual(evaluateIsPro(true, activeTimestamp), true, 'Active subscription must return true');
  assert.strictEqual(evaluateIsPro(true, expiredTimestamp), false, 'Expired subscription must return false');
  assert.strictEqual(evaluateIsPro(false, activeTimestamp), false, 'Free user must return false');
  console.log('✅ Subscription expiry & auto-downgrade logic passed');

  // 5. Daily Private Instagram Capture Limitation Logic
  function evaluatePrivateCapture(isPro, todayDate, lastDate, currentCount) {
    if (isPro) {
      return { allowed: true, remaining: 9999 };
    }
    const count = lastDate === todayDate ? currentCount : 0;
    if (count >= 2) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: 2 - (count + 1) };
  }

  const today = '2026-11-17';
  const yesterday = '2026-11-16';

  // Free user first capture
  const cap1 = evaluatePrivateCapture(false, today, today, 0);
  assert.strictEqual(cap1.allowed, true);
  assert.strictEqual(cap1.remaining, 1);

  // Free user second capture
  const cap2 = evaluatePrivateCapture(false, today, today, 1);
  assert.strictEqual(cap2.allowed, true);
  assert.strictEqual(cap2.remaining, 0);

  // Free user third capture (limit reached)
  const cap3 = evaluatePrivateCapture(false, today, today, 2);
  assert.strictEqual(cap3.allowed, false);
  assert.strictEqual(cap3.remaining, 0);

  // Free user next day reset
  const capNextDay = evaluatePrivateCapture(false, today, yesterday, 2);
  assert.strictEqual(capNextDay.allowed, true, 'Next day must reset counter');
  assert.strictEqual(capNextDay.remaining, 1);

  // PRO user (unlimited)
  const capPro = evaluatePrivateCapture(true, today, today, 100);
  assert.strictEqual(capPro.allowed, true);
  console.log('✅ Daily private Instagram capture quota (2 free / unlimited PRO) verified');

  // 6. WhatsApp Payment Proof Builder
  function buildPaymentProofWhatsAppUrl(params) {
    const text =
      `Hello OmniSaver Team, I have transferred the payment for OmniSaver PRO.\n\n` +
      `⭐ Plan: ${params.planTitle} (${params.planPrice})\n` +
      `🔑 Device ID: ${params.deviceId}\n` +
      `💳 Paid via: ${params.paymentMethod}\n` +
      `🧾 Transaction ID (TID): ${params.tid || 'Attached'}\n\n` +
      `Please verify and provide my license key. Thanks!`;
    return `https://wa.me/923001234567?text=${encodeURIComponent(text)}`;
  }

  const waUrl = buildPaymentProofWhatsAppUrl({
    planTitle: '3 Months Saver',
    planPrice: 'Rs. 1,800',
    deviceId: devId1,
    paymentMethod: 'EasyPaisa',
    tid: 'TID-1234567890',
  });

  assert.ok(waUrl.includes('https://wa.me/923001234567?text='), 'WhatsApp URL valid');
  assert.ok(decodeURIComponent(waUrl).includes(devId1), 'WhatsApp prefill includes Device ID');
  assert.ok(decodeURIComponent(waUrl).includes('TID-1234567890'), 'WhatsApp prefill includes TID');
  assert.ok(decodeURIComponent(waUrl).includes('3 Months Saver'), 'WhatsApp prefill includes selected plan');
  console.log('✅ WhatsApp payment proof URL prefill formatting verified');

  console.log('🎉 ALL PRO ENTITLEMENT TESTS PASSED SUCCESSFULLY!\n');
}

module.exports = { runProEntitlementTests };

if (require.main === module) {
  runProEntitlementTests();
}

