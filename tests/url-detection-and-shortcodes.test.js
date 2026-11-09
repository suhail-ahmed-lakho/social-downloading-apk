// tests/url-detection-and-shortcodes.test.js
const assert = require('assert');

// Extraction logic under test (matching src/services/api/extractor.ts)
function cleanInputUrl(input) {
  if (!input) return '';
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/https?:\/\/(?:(?!https?:\/\/)[^\s"'<>])+/i);
  if (urlMatch) {
    return urlMatch[0];
  }
  return trimmed;
}

function detectPlatform(url) {
  const cleanUrl = cleanInputUrl(url).toLowerCase();
  if (cleanUrl.includes('tiktok.com')) return 'tiktok';
  if (
    cleanUrl.includes('instagram.com') ||
    cleanUrl.includes('instagr.am') ||
    cleanUrl.includes('ddinstagram.com')
  ) {
    return 'instagram';
  }
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) return 'youtube';
  return 'unknown';
}

function extractInstagramShortcode(url) {
  const clean = cleanInputUrl(url);
  const match =
    clean.match(/(?:instagram\.com|instagr\.am)\/(?:share\/)?(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i) ||
    clean.match(/(?:instagram\.com|instagr\.am)\/[^/]+\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

function extractYouTubeId(url) {
  const clean = cleanInputUrl(url);
  const match = clean.match(/(?:youtu\.be\/|(?:www\.|m\.|music\.)?youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  return match ? match[1] : null;
}

function runDetectionTests() {
  console.log('\n==================================================');
  console.log('🧪 RUNNING EXTENDED URL DETECTION & SHORTCODE TESTS');
  console.log('==================================================');

  // 1. Instagram variations
  const instagramSamples = [
    { url: 'https://www.instagram.com/reel/C32sVwrrf5z/', expectedId: 'C32sVwrrf5z', label: 'Canonical Reel' },
    { url: 'https://www.instagram.com/reels/C32sVwrrf5z/', expectedId: 'C32sVwrrf5z', label: 'Plural Reels' },
    { url: 'https://www.instagram.com/share/reel/C32sVwrrf5z/?igsh=MWx1Y201', expectedId: 'C32sVwrrf5z', label: 'Mobile Share Sheet Link' },
    { url: 'https://www.instagram.com/p/C7z19hXMo6k/', expectedId: 'C7z19hXMo6k', label: 'Post (p/)' },
    { url: 'https://www.instagram.com/share/p/C7z19hXMo6k/?igsh=abc1234', expectedId: 'C7z19hXMo6k', label: 'Share Post' },
    { url: 'https://www.instagram.com/tv/B8bXYZ12345/', expectedId: 'B8bXYZ12345', label: 'IGTV' },
    { url: 'https://www.instagram.com/cristiano/reel/C32sVwrrf5z/', expectedId: 'C32sVwrrf5z', label: 'Reel with Username' },
    { url: 'https://instagr.am/p/C7z19hXMo6k/', expectedId: 'C7z19hXMo6k', label: 'instagr.am short URL' },
    { url: 'https://ddinstagram.com/reel/C32sVwrrf5z/', expectedId: 'C32sVwrrf5z', label: 'ddinstagram embed' },
    { url: 'Look at this funny reel https://www.instagram.com/reel/C32sVwrrf5z/?igsh=123 on IG!', expectedId: 'C32sVwrrf5z', label: 'Text with Embedded URL' },
    { url: 'https://www.instagram.com/reel/DehZrPKNt5t/?mdxt=MTB0a2lhZjNocTRxaQ==', expectedId: 'DehZrPKNt5t', label: 'User Reel 1 with Query params' },
    { url: 'https://www.instagram.com/reel/Dfb4jR_Bkx5/?psln=MW8yZXQ1Mndlb3h1Yw==', expectedId: 'Dfb4jR_Bkx5', label: 'User Reel 3 with Query params' },
    { url: 'https://www.instagram.com/reel/DehZrPKNt5t/?mdxt=MTB0a2lhZjNocTRxaQ==https://www.instagram.com/reel/DfgbJK3M6gH/?obrf=ems4MGh2b2hqengx', expectedId: 'DehZrPKNt5t', label: 'Concatenated URLs' }
  ];

  for (const sample of instagramSamples) {
    const platform = detectPlatform(sample.url);
    const shortcode = extractInstagramShortcode(sample.url);
    assert.strictEqual(platform, 'instagram', `Failed platform detection for: ${sample.label}`);
    assert.strictEqual(shortcode, sample.expectedId, `Failed shortcode extraction for: ${sample.label} (Got: ${shortcode}, Expected: ${sample.expectedId})`);
    console.log(`  ✅ Instagram ${sample.label} -> shortcode: ${shortcode}`);
  }

  // 2. TikTok variations
  const tiktokSamples = [
    { url: 'https://www.tiktok.com/@creator/video/7123456789012345678', label: 'Full TikTok web URL' },
    { url: 'https://vt.tiktok.com/ZSxxxxxx/', label: 'vt.tiktok.com short link' },
    { url: 'https://vm.tiktok.com/ZMxxxxxx/', label: 'vm.tiktok.com short link' },
    { url: 'Check out this TikTok video! https://vt.tiktok.com/ZSxxxxxx/ sent from WhatsApp', label: 'Text with TikTok link' }
  ];

  for (const sample of tiktokSamples) {
    const platform = detectPlatform(sample.url);
    assert.strictEqual(platform, 'tiktok', `Failed TikTok detection for: ${sample.label}`);
    console.log(`  ✅ TikTok ${sample.label} -> detected: tiktok`);
  }

  // 3. YouTube variations
  const youtubeSamples = [
    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expectedId: 'dQw4w9WgXcQ', label: 'Regular watch?v=' },
    { url: 'https://youtu.be/dQw4w9WgXcQ', expectedId: 'dQw4w9WgXcQ', label: 'youtu.be short link' },
    { url: 'https://www.youtube.com/shorts/3fD3d8bC8yA', expectedId: '3fD3d8bC8yA', label: 'YouTube Shorts' },
    { url: 'https://music.youtube.com/watch?v=dQw4w9WgXcQ', expectedId: 'dQw4w9WgXcQ', label: 'YouTube Music' },
    { url: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ', expectedId: 'dQw4w9WgXcQ', label: 'Mobile m.youtube' },
    { url: 'Listen to this track: https://youtu.be/dQw4w9WgXcQ from YouTube', expectedId: 'dQw4w9WgXcQ', label: 'Text with YouTube link' }
  ];

  for (const sample of youtubeSamples) {
    const platform = detectPlatform(sample.url);
    const id = extractYouTubeId(sample.url);
    assert.strictEqual(platform, 'youtube', `Failed YouTube detection for: ${sample.label}`);
    assert.strictEqual(id, sample.expectedId, `Failed YouTube ID extraction for: ${sample.label}`);
    console.log(`  ✅ YouTube ${sample.label} -> id: ${id}`);
  }

  console.log('\n🎉 ALL URL DETECTION & SHORTCODE TESTS PASSED!\n');
}

module.exports = { runDetectionTests };

if (require.main === module) {
  runDetectionTests();
}

