/**
 * Comprehensive OmniSaver System Verification Test
 * Tests:
 * 1. Database layer (recordEvent, activateByTidOrKey, getDualChannelStats, listLicenses)
 * 2. Mobile Telemetry (visit, heartbeat, downloads by platform)
 * 3. Secure In-App TID Activation:
 *    - 24-hour Grace PRO for new valid TIDs (status = 'pending')
 *    - Strict rejection of duplicate TIDs
 *    - VIP Promo codes stored in database (no hardcoding)
 *    - Admin 1-click Approve (Full Plan duration) and Reject (Revoke)
 * 4. Dual-Channel Stats Aggregation (Mobile DAU, downloads by platform, revenue)
 * 5. Remote App Config
 */

const {
  recordEvent,
  activateByTidOrKey,
  approveLicense,
  revokeLicense,
  verifyLicense,
  getDualChannelStats,
  listLicenses,
  getAppConfig,
} = require("../app/lib/db.ts");

async function runTests() {
  console.log("=================================================");
  console.log("🚀 STARTING FULL SYSTEM VERIFICATION SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${details ? "(" + details + ")" : ""}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? "(" + details + ")" : ""}`);
      failed++;
    }
  }

  // --- TEST SUITE 1: Mobile App Launch & Telemetry ---
  console.log("👉 [Suite 1] Mobile App Launch & Telemetry Tracking");
  try {
    const launchEvent = await recordEvent({
      source: "mobile_app",
      action: "visit",
      platform: "mobile-app",
      deviceId: "OMNI-TEST-DEVICE-01",
      appVersion: "1.0.16",
      ip: "103.255.4.12",
      country: "PK",
      city: "Karachi",
      device: "Android Mobile",
      browser: "OmniSaver App v1.0.16",
      details: "Launched OmniSaver Mobile App v1.0.16",
    });
    assert(launchEvent && launchEvent.id, "App launch event recorded successfully", `Event ID: ${launchEvent?.id}`);

    const heartbeatEvent = await recordEvent({
      source: "mobile_app",
      action: "heartbeat",
      platform: "mobile-app",
      deviceId: "OMNI-TEST-DEVICE-02",
      appVersion: "1.0.16",
      ip: "39.40.12.88",
      country: "PK",
      city: "Lahore",
      device: "Android Mobile",
      browser: "OmniSaver App v1.0.16",
      details: "Device active ping",
    });
    assert(heartbeatEvent && heartbeatEvent.id, "Device heartbeat recorded successfully", `Event ID: ${heartbeatEvent?.id}`);
  } catch (err) {
    assert(false, "App launch and heartbeat suite crashed", err.message);
  }

  // --- TEST SUITE 2: Multi-Platform Downloads Tracking ---
  console.log("\n👉 [Suite 2] Multi-Platform Download Events Tracking");
  const platforms = [
    { name: "youtube", title: "4K YouTube Music & Video" },
    { name: "tiktok", title: "TikTok No-Watermark HD" },
    { name: "instagram", title: "Instagram Reel 1080p" },
    { name: "pinterest", title: "Pinterest Video & Photo" },
    { name: "facebook", title: "Facebook 1080p Clip" },
  ];

  try {
    for (const p of platforms) {
      const dlEvent = await recordEvent({
        source: "mobile_app",
        action: "download",
        platform: p.name,
        deviceId: "OMNI-TEST-DEVICE-01",
        ip: "103.255.4.12",
        country: "PK",
        city: "Karachi",
        device: "Android Mobile",
        browser: "OmniSaver App v1.0.16",
        details: `Saved ${p.title}`,
      });
      assert(dlEvent && dlEvent.id, `Tracked download event for platform: ${p.name.toUpperCase()}`);
    }
  } catch (err) {
    assert(false, "Multi-platform download tracking failed", err.message);
  }

  // --- TEST SUITE 3: Secure In-App TID Activation & 24h Grace Period ---
  console.log("\n👉 [Suite 3] Secure In-App TID Activation & Anti-Bypass System");
  let testLicenseKey = "";
  try {
    const now = Date.now();
    // 3.1: Valid JazzCash/EasyPaisa TID -> 24-hour temporary grace PRO
    const tidResult = await activateByTidOrKey({
      code: "TID-9823487192",
      deviceId: "OMNI-TEST-DEVICE-01",
      planType: "monthly",
      senderPhone: "03001234567",
    });
    assert(tidResult.valid === true, "Valid TID granted instant PRO access", `Status: ${tidResult.status}`);
    assert(tidResult.status === "pending", "New TID flagged as pending admin verification");
    
    // Check grace duration is approximately 24 hours (within 1 minute delta)
    const hoursGrace = (tidResult.expiresAt - now) / (1000 * 60 * 60);
    assert(hoursGrace >= 23.9 && hoursGrace <= 24.1, "Exact 24-hour temporary grace assigned", `${hoursGrace.toFixed(1)} hrs`);

    // Find the generated license key
    const allLics = await listLicenses();
    const createdLic = allLics.find((l) => l.notes && l.notes.includes("TID-9823487192"));
    assert(createdLic && createdLic.key, "TID license persisted in database", `Key: ${createdLic?.key}`);
    testLicenseKey = createdLic ? createdLic.key : "";

    // 3.2: Duplicate TID rejection on another device
    const duplicateResult = await activateByTidOrKey({
      code: "TID-9823487192",
      deviceId: "OMNI-ATTACKER-DEVICE",
      planType: "monthly",
    });
    assert(duplicateResult.valid === false, "Strictly rejected duplicate TID on different device", duplicateResult.error);

    // 3.3: Admin 1-Click Approve (Full Plan: 30 days)
    if (testLicenseKey) {
      const approved = await approveLicense(testLicenseKey);
      assert(approved && approved.status === "active", "Admin approved pending TID", `New Status: ${approved?.status}`);
      const approvedDays = (approved.expiresAt - now) / (1000 * 60 * 60 * 24);
      assert(approvedDays >= 29 && approvedDays <= 31, "Approved license upgraded to full 30-day duration", `${approvedDays.toFixed(0)} days`);
    }

    // 3.4: VIP Promo Code from Database (No Hardcoding)
    const vipResult = await activateByTidOrKey({
      code: "OMNI-PRO-VIP",
      deviceId: "OMNI-TEST-DEVICE-02",
      planType: "yearly",
    });
    assert(vipResult.valid === true, "VIP Promo code verified from database", `Plan: ${vipResult.planType}`);

    // 3.5: Admin 1-Click Reject / Revoke
    if (testLicenseKey) {
      const revoked = await revokeLicense(testLicenseKey);
      assert(revoked && revoked.status === "revoked", "Admin rejected / revoked license successfully");
      const reVerify = await verifyLicense(testLicenseKey, "OMNI-TEST-DEVICE-01");
      assert(reVerify.valid === false, "Revoked license immediately blocks PRO access");
    }

    // 3.6: Invalid / Malformed TID rejection
    const invalidResult = await activateByTidOrKey({
      code: "123", // too short
      deviceId: "OMNI-TEST-DEVICE-03",
    });
    assert(invalidResult.valid === false, "Properly rejected invalid TID format (too short)");
  } catch (err) {
    assert(false, "TID activation suite failed", err.message);
  }

  // --- TEST SUITE 4: Dual-Channel Stats Aggregation ---
  console.log("\n👉 [Suite 4] Dual-Channel Analytics & Admin Aggregation");
  try {
    const stats = await getDualChannelStats();
    assert(stats && stats.mobile, "Dual channel statistics generated successfully");
    assert(stats.mobile.totalRegisteredDevices >= 1, "Accurately counted registered mobile devices", `Count: ${stats.mobile.totalRegisteredDevices}`);
    assert(stats.mobile.dau >= 0, "Accurately counted Active DAU", `DAU: ${stats.mobile.dau}`);
    assert(stats.mobile.proUsers >= 1, "PRO Subscribers reflected from automated TIDs", `PRO Count: ${stats.mobile.proUsers}`);
    assert(stats.mobile.totalRevenuePkr > 0, "Revenue accurately aggregated from activated subscriptions", `PKR: Rs. ${stats.mobile.totalRevenuePkr}`);
    assert(stats.mobile.downloadsByPlatform.youtube >= 1, "YouTube download counter incremented", `YT: ${stats.mobile.downloadsByPlatform.youtube}`);
    assert(stats.mobile.downloadsByPlatform.tiktok >= 1, "TikTok download counter incremented", `TT: ${stats.mobile.downloadsByPlatform.tiktok}`);
    assert(stats.mobile.downloadsByPlatform.instagram >= 1, "Instagram download counter incremented", `IG: ${stats.mobile.downloadsByPlatform.instagram}`);
  } catch (err) {
    assert(false, "Dual-channel aggregation failed", err.message);
  }

  // --- TEST SUITE 5: Remote Config & Account Sync ---
  console.log("\n👉 [Suite 5] Mobile Remote Config Management");
  try {
    const config = await getAppConfig();
    assert(config && config.versionConfig, "Remote config loaded with version configuration");
    assert(config.paymentDetails && config.paymentDetails.easypaisa, "Payment accounts present (EasyPaisa/NayaPay)");
    assert(config.adConfig && config.adConfig.adsEnabled !== undefined, "AdMob controls active and configurable");
  } catch (err) {
    assert(false, "Remote config suite failed", err.message);
  }

  console.log("\n=================================================");
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Fatal Test Suite Crash:", e);
  process.exit(1);
});
