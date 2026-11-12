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
  assert.strictEqual(appConfig.expo.name, 'OmniSaver', 'App name must stay short (OmniSaver)');
  assert.strictEqual(appConfig.expo.android.adaptiveIcon.backgroundColor, '#FF4757', 'Adaptive icon bg must match coral gradient');

  const downloadManagerSrc = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'services', 'download', 'downloadManager.ts'),
    'utf8'
  );
  assert.ok(!downloadManagerSrc.includes('addAssetsToAlbumAsync'), 'Avoid moving MediaStore assets (triggers Android modify prompt)');
  console.log('✅ Native Android background & notification app.json validation passed');

  // 6. Chunked streams without Content-Length fall back to estimatedTotalBytes smoothly
  const estTotal = 115 * MB;
  const estTelemetry = telemetry.computeDownloadTelemetry({
    writtenBytes: 79.8 * MB,
    totalBytes: 0,
    estimatedTotalBytes: estTotal,
    samples,
    statusText: 'Downloading HD video...',
  });
  assert.strictEqual(estTelemetry.isEstimated, true);
  assert.strictEqual(estTelemetry.percent, 69);
  assert.strictEqual(estTelemetry.totalBytes, estTotal);
  assert.strictEqual(estTelemetry.remainingMB, '35.2 MB');
  assert.ok(estTelemetry.etaText.includes('left'), `Expected valid ETA text, got ${estTelemetry.etaText}`);

  // When actual streamed bytes exceed initial estimate slightly, progress stays <= 98% instead of freezing at 100%
  const overEstTelemetry = telemetry.computeDownloadTelemetry({
    writtenBytes: 120 * MB,
    totalBytes: 0,
    estimatedTotalBytes: estTotal,
    samples,
  });
  assert.strictEqual(overEstTelemetry.isEstimated, true);
  assert.ok(overEstTelemetry.percent > 0 && overEstTelemetry.percent <= 98);
  assert.ok(overEstTelemetry.totalBytes > 120 * MB);
  console.log('✅ Estimated telemetry fallback (when Content-Length missing) passed');

  // 7. Media header container inspection & extension preservation
  const dmPath = path.join(__dirname, '..', 'src', 'services', 'download', 'downloadManager.ts');
  const dmSource = fs.readFileSync(dmPath, 'utf8');
  const dmTranspiled = ts.transpileModule(dmSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const dmMod = { exports: {} };
  const stubRequire = (id) => {
    if (id === 'react-native') return { Platform: { OS: 'android' } };
    if (id.startsWith('expo-') || id.startsWith('../api/')) return {};
    return require(id);
  };
  new vm.Script(dmTranspiled.outputText, { filename: dmPath }).runInContext(
    vm.createContext({ module: dmMod, exports: dmMod.exports, require: stubRequire, Uint8Array, String, console })
  );
  const dm = dmMod.exports;

  assert.strictEqual(dm.sanitizeMediaFilename('Test_Song', true, '.m4a'), 'Test_Song.m4a');
  assert.strictEqual(dm.sanitizeMediaFilename('Test_Song.mp3', true, '.m4a'), 'Test_Song.m4a');

  const mp4Header = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0]);
  assert.strictEqual(dm.inspectMediaHeaderBytes(mp4Header, '.m4a', true).valid, true);
  assert.strictEqual(dm.inspectMediaHeaderBytes(mp4Header, '.m4a', true).detectedExt, '.m4a');
  assert.strictEqual(dm.inspectMediaHeaderBytes(mp4Header, '.mp4', false).detectedExt, '.mp4');

  const id3Header = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xfb]);
  assert.strictEqual(dm.inspectMediaHeaderBytes(id3Header, '.mp3', true).valid, true);

  const htmlError = new TextEncoder().encode('<!DOCTYPE html><html><body>502 Bad Gateway</body></html>');
  assert.strictEqual(dm.inspectMediaHeaderBytes(htmlError, '.mp3', true).valid, false);

  const jsonError = new TextEncoder().encode('{"error":"rate limited","status":429}');
  assert.strictEqual(dm.inspectMediaHeaderBytes(jsonError, '.mp4', false).valid, false);
  console.log('✅ Container header inspection & M4A extension validation passed');

  // 8. Verify YouTube option ordering keeps 1080p H.264 default before 4K AV1 & M4A audio first
  const extractorSrc = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'services', 'api', 'extractor.ts'),
    'utf8'
  );
  const idx1080 = extractorSrc.indexOf('loader:1080:${ytId}');
  const idx4k = extractorSrc.indexOf('loader:4k:${ytId}');
  const idxM4a = extractorSrc.indexOf('loader:m4a:${ytId}');
  const idxMp3 = extractorSrc.indexOf('loader:mp3:${ytId}');
  assert.ok(idx1080 > 0 && idx4k > idx1080, '1080p H.264 must precede 4K AV1 as default quality');
  assert.ok(idxM4a > 0 && idxMp3 > idxM4a, 'M4A faststart audio must precede MP3 as default song format');
  console.log('✅ YouTube compatible quality & song ordering validation passed');
}

if (require.main === module) {
  runTelemetryTests();
}

module.exports = { runTelemetryTests };

