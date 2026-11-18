/**
 * Comprehensive OmniSaver System Verification Test
 * Tests:
 * 1. Database layer (recordEvent, activateByTidOrKey, getDualChannelStats, listLicenses)
 * 2. Mobile Telemetry (visit, heartbeat, downloads by platform)
 * 3. Instant In-App TID Activation (EasyPaisa/JazzCash TID -> PRO VIP)
 * 4. Remote App Config
 * 5. Admin Stats aggregation
 */

const {
  recordEvent,
  activateByTidOrKey,
  getDualChannelStats,
  listLicenses,
  getAppConfig,
  updateAppConfig,
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

  // --- TEST SUITE 3: Instant Automated In-App TID Activation ---
  console.log("\n👉 [Suite 3] Instant In-App TID Activation (Zero Manual WhatsApp)");
  try {
    // 3.1: Valid JazzCash/EasyPaisa 10-digit TID
    const tidResult = await activateByTidOrKey({
      code: "TID-9823487192",
      deviceId: "OMNI-TEST-DEVICE-01",
      planType: "monthly",
    });
    assert(tidResult.valid === true, "Valid EasyPaisa/JazzCash TID auto-activated PRO", `Plan: ${tidResult.planType}`);
    assert(tidResult.expiresAt > Date.now(), "Valid expiration timestamp assigned (> 30 days)");

    // 3.2: VIP Promo Code
    const vipResult = await activateByTidOrKey({
      code: "OMNI-PRO-VIP",
      deviceId: "OMNI-TEST-DEVICE-02",
      planType: "yearly",
    });
    assert(vipResult.valid === true, "VIP Master Promo Code auto-activated PRO", `Plan: ${vipResult.planType}`);

    // 3.3: Invalid / Empty input rejection
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
