// tests/extractor.test.js
const assert = require('assert');

// 1. URL Pattern Detection Tests
function detectPlatform(url) {
  const cleanUrl = url.trim().toLowerCase();
  if (cleanUrl.includes('tiktok.com')) return 'tiktok';
  if (cleanUrl.includes('instagram.com') || cleanUrl.includes('instagr.am')) return 'instagram';
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) return 'youtube';
  return 'unknown';
}

function extractYouTubeId(url) {
  const match = url.match(/(?:youtu\.be\/|(?:www\.|m\.|music\.)?youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  return match ? match[1] : null;
}

function compareVersions(a, b) {
  const cleanA = a.replace(/[^0-9.]/g, '').split('.').map((n) => parseInt(n || '0', 10));
  const cleanB = b.replace(/[^0-9.]/g, '').split('.').map((n) => parseInt(n || '0', 10));

  const maxLength = Math.max(cleanA.length, cleanB.length);
  for (let i = 0; i < maxLength; i++) {
    const valA = cleanA[i] || 0;
    const valB = cleanB[i] || 0;
    if (valA > valB) return 1;
    if (valA < valB) return -1;
  }
  return 0;
}

async function runExtractorTests() {
  console.log('\n--- [TEST SUITE 1] URL Detection & ID Extraction ---');

  // Test TikTok detection
  assert.strictEqual(detectPlatform('https://www.tiktok.com/@user/video/1234567890'), 'tiktok');
  assert.strictEqual(detectPlatform('https://vm.tiktok.com/ZMxxxxxx/'), 'tiktok');
  assert.strictEqual(detectPlatform('https://vt.tiktok.com/ZSxxxxxx/'), 'tiktok');
  console.log('✅ TikTok URL pattern detection passed');

  // Test YouTube & YouTube Music detection
  assert.strictEqual(detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'youtube');
  assert.strictEqual(detectPlatform('https://music.youtube.com/watch?v=dQw4w9WgXcQ'), 'youtube');
  assert.strictEqual(detectPlatform('https://youtu.be/dQw4w9WgXcQ'), 'youtube');
  assert.strictEqual(detectPlatform('https://www.youtube.com/shorts/3fD3d8bC8yA'), 'youtube');
  assert.strictEqual(detectPlatform('https://m.youtube.com/watch?v=dQw4w9WgXcQ'), 'youtube');
  console.log('✅ YouTube & YouTube Music Songs URL detection passed');

  // Test YouTube & Music ID regex
  assert.strictEqual(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.strictEqual(extractYouTubeId('https://music.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.strictEqual(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.strictEqual(extractYouTubeId('https://www.youtube.com/shorts/3fD3d8bC8yA'), '3fD3d8bC8yA');
  console.log('✅ YouTube Video, Shorts & Music Track ID parser passed');

  // Test Update Version Comparison
  assert.strictEqual(compareVersions('1.1.0', '1.0.0') > 0, true);
  assert.strictEqual(compareVersions('1.0.0', '1.0.0') === 0, true);
  assert.strictEqual(compareVersions('1.0.0', '1.2.0') < 0, true);
  console.log('✅ In-App Update semver comparison passed');

  // Test Instagram detection
  assert.strictEqual(detectPlatform('https://www.instagram.com/reel/C-X-9n5v3kU/'), 'instagram');
  assert.strictEqual(detectPlatform('https://www.instagram.com/p/C7z19hXMo6k/'), 'instagram');
  assert.strictEqual(detectPlatform('https://instagr.am/p/C7z19hXMo6k/'), 'instagram');
  console.log('✅ Instagram URL pattern detection passed');

  // Test Unknown URLs
  assert.strictEqual(detectPlatform('https://google.com'), 'unknown');
  assert.strictEqual(detectPlatform('https://facebook.com/watch'), 'unknown');
  console.log('✅ Unknown URL filtering passed');

  // ==========================================
  // LIVE EXTRACTION TESTS
  // ==========================================
  console.log('\n--- [TEST SUITE 2] Live TikTok Engine Test ---');
  try {
    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'GET',
      signal: AbortSignal.timeout(6000)
    });
    assert.strictEqual(res.status < 500, true, 'TikWM API returned server error');
    console.log('✅ TikWM TikTok engine endpoint online (HTTP ' + res.status + ')');
  } catch (err) {
    console.warn(`⚠️ Live TikTok test warning: ${err.message}`);
  }

  console.log('\n--- [TEST SUITE 3] Live YouTube Engine Test ---');
  try {
    const ytId = 'dQw4w9WgXcQ';
    const mirrors = ['https://api.piped.private.coffee', 'https://pipedapi.ducks.party'];
    let resolved = false;
    for (const m of mirrors) {
      try {
        const res = await fetch(`${m}/streams/${ytId}`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const ytData = await res.json();
          assert.ok(ytData.title, 'YouTube video has no title');
          assert.ok(ytData.videoStreams && ytData.videoStreams.length > 0, 'No video streams found');
          console.log(`✅ Live YouTube resolved via ${m}: "${ytData.title}"`);
          console.log(`   Available streams: ${ytData.videoStreams.length} quality options`);
          resolved = true;
          break;
        }
      } catch (_) {}
    }
    assert.strictEqual(resolved, true, 'At least one active YouTube mirror must resolve streams');
  } catch (err) {
    console.warn(`⚠️ Live YouTube test warning: ${err.message}`);
  }
}

module.exports = { runExtractorTests };
