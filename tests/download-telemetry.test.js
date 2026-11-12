// tests/download-telemetry.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

function loadTelemetryModule() {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'download', 'downloadTelemetry.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });

  const mod = { exports: {} };
  const fn = new vm.Script(transpiled.outputText, { filename: filePath });
  const context = vm.createContext({
    module: mod,
    exports: mod.exports,
    require,
    Date,
    Math,
    Number,
    console,
  });
  fn.runInContext(context);
  return mod.exports;
}

function runTelemetryTests() {
  console.log('\n--- [TEST SUITE 6] Live Speed, MB, Remaining MB & Background Config ---');
  const telemetry = loadTelemetryModule();

  // 1. Byte formatting checks
  assert.strictEqual(telemetry.formatBytesToMB(0), '0.00 MB');
  assert.strictEqual(telemetry.formatBytesToMB(5 * 1024 * 1024), '5.00 MB');
  assert.strictEqual(telemetry.formatBytesToMB(12.34 * 1024 * 1024), '12.3 MB');
  assert.strictEqual(telemetry.formatBytesToMB(140 * 1024 * 1024), '140 MB');
  console.log('✅ MB size formatting checks passed');

  // 2. Speed formatting checks
  assert.strictEqual(telemetry.formatSpeed(0), '0 KB/s');
  assert.strictEqual(telemetry.formatSpeed(512 * 1024), '512 KB/s');
  assert.strictEqual(telemetry.formatSpeed(2.45 * 1024 * 1024), '2.45 MB/s');
  assert.strictEqual(telemetry.formatSpeed(18.6 * 1024 * 1024), '18.6 MB/s');
  console.log('✅ Speed formatting checks passed');

  // 3. ETA formatting checks
  assert.strictEqual(telemetry.formatEta(null), '--');
  assert.strictEqual(telemetry.formatEta(0.4), '<1s');
  assert.strictEqual(telemetry.formatEta(12), '12s left');
  assert.strictEqual(telemetry.formatEta(95), '1m 35s left');
  console.log('✅ ETA formatting checks passed');

  // 4. Rolling window speed & remaining MB calculation
  const MB = 1024 * 1024;
  let samples = telemetry.recordSpeedSample([], 0, 1000);
  samples = telemetry.recordSpeedSample(samples, 5 * MB, 2000);
  samples = telemetry.recordSpeedSample(samples, 10 * MB, 3000);

  const info = telemetry.computeDownloadTelemetry({
    writtenBytes: 10 * MB,
    totalBytes: 25 * MB,
    samples,
    statusText: 'Downloading HD video...',
  });

  assert.strictEqual(info.percent, 40);
  assert.strictEqual(info.downloadedMB, '10.0 MB');
  assert.strictEqual(info.totalMB, '25.0 MB');
  assert.strictEqual(info.remainingBytes, 15 * MB);
  assert.strictEqual(info.remainingMB, '15.0 MB');
  assert.strictEqual(info.speedText, '5.00 MB/s');
  assert.strictEqual(info.etaText, '3s left');
  console.log('✅ Telemetry calculation (%, speed, downloaded MB, remaining MB, ETA) passed');

  // 5. Verify app.json native background & notification permissions/plugins
  const appConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8')
  );
  const perms = appConfig.expo.android.permissions || [];
  assert.ok(perms.includes('android.permission.POST_NOTIFICATIONS'), 'POST_NOTIFICATIONS missing');
  assert.ok(perms.includes('android.permission.FOREGROUND_SERVICE'), 'FOREGROUND_SERVICE missing');
  assert.ok(perms.includes('android.permission.FOREGROUND_SERVICE_DATA_SYNC'), 'FOREGROUND_SERVICE_DATA_SYNC missing');
  assert.ok(perms.includes('android.permission.RUN_USER_INITIATED_JOBS'), 'RUN_USER_INITIATED_JOBS missing');

  const plugins = appConfig.expo.plugins || [];
  const hasBgPlugin = plugins.some(
    (p) => p === '@kesha-antonov/react-native-background-downloader' || (Array.isArray(p) && p[0] === '@kesha-antonov/react-native-background-downloader')
  );
  const hasNotifPlugin = plugins.some(
    (p) => p === 'expo-notifications' || (Array.isArray(p) && p[0] === 'expo-notifications')
  );
  assert.ok(hasBgPlugin, 'Background downloader config plugin missing in app.json');
  assert.ok(hasNotifPlugin, 'expo-notifications config plugin missing in app.json');
  console.log('✅ Native Android background & notification app.json validation passed');
}

if (require.main === module) {
  runTelemetryTests();
}

module.exports = { runTelemetryTests };

