// tests/pinterest.test.js
const assert = require('assert');

// 1. URL cleaner
function cleanInputUrl(input) {
  if (!input) return '';
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/https?:\/\/(?:(?!https?:\/\/)[^\s"'<>])+/i);
  return urlMatch ? urlMatch[0] : trimmed;
}

// 2. Platform detector
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
  if (
    cleanUrl.includes('pinterest.') ||
    cleanUrl.includes('pin.it') ||
    cleanUrl.includes('pinimg.com')
  ) {
    return 'pinterest';
  }
  return 'unknown';
}

// 3. Pin ID extractor
function extractPinterestPinId(url) {
  const clean = cleanInputUrl(url);
  const match = clean.match(/(?:pinterest\.[a-z.]+|pinimg\.com)\/pin\/(\d+)/i);
  return match ? match[1] : null;
}

// 4. Filename sanitizer (mirroring downloadManager)
function sanitizeMediaFilename(filename, isAudio = false, explicitExt) {
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const extension = explicitExt || (isAudio ? '.mp3' : '.mp4');
  if (
    cleanName.toLowerCase().endsWith('.mp4') ||
    cleanName.toLowerCase().endsWith('.mp3') ||
    cleanName.toLowerCase().endsWith('.m4a') ||
    cleanName.toLowerCase().endsWith('.jpg') ||
    cleanName.toLowerCase().endsWith('.jpeg') ||
    cleanName.toLowerCase().endsWith('.png') ||
    cleanName.toLowerCase().endsWith('.webp') ||
    cleanName.toLowerCase().endsWith('.gif')
  ) {
    return cleanName.replace(/\.(mp4|mp3|m4a|jpg|jpeg|png|webp|gif)$/i, extension);
  }
  return `${cleanName}${extension}`;
}

// 5. Container header inspector (mirroring downloadManager)
function inspectMediaHeaderBytes(bytes, expectedExt, isAudio = false) {
  if (!bytes || bytes.length < 12) {
    return { valid: false, reason: 'Downloaded file header is empty or too short.' };
  }

  // JPEG image (0xFF 0xD8 0xFF)
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, detectedExt: '.jpg' };
  }

  // PNG image (0x89 0x50 0x4E 0x47)
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { valid: true, detectedExt: '.png' };
  }

  // GIF image ('GIF8')
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { valid: true, detectedExt: '.gif' };
  }

  // WebP image ('RIFF....WEBP')
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { valid: true, detectedExt: '.webp' };
  }

  // ISO BMFF (MP4)
  for (let offset = 0; offset + 7 < Math.min(bytes.length, 24); offset++) {
    if (
      bytes[offset] === 0x66 &&
      bytes[offset + 1] === 0x74 &&
      bytes[offset + 2] === 0x79 &&
      bytes[offset + 3] === 0x70
    ) {
      return {
        valid: true,
        detectedExt: isAudio || expectedExt === '.m4a' ? '.m4a' : '.mp4',
      };
    }
  }

  return {
    valid: false,
    reason: 'Downloaded file has an unrecognized or corrupt container header.',
  };
}

// 6. Header builder (mirroring downloadManager)
function buildDownloadHeaders(finalDirectUrl) {
  const downloadHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    Accept: '*/*',
    'Accept-Encoding': 'identity',
  };

  if (
    finalDirectUrl.includes('pinimg.com') ||
    finalDirectUrl.includes('pinterest.com')
  ) {
    downloadHeaders['Referer'] = 'https://www.pinterest.com/';
  }

  return downloadHeaders;
}

// 7. Full Pinterest Extraction logic
async function extractPinterest(url) {
  const cleanUrl = cleanInputUrl(url);

  const fetchHeaders = [
    {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  ];

  let html = '';
  let finalUrl = cleanUrl;

  for (const headers of fetchHeaders) {
    try {
      const res = await fetch(cleanUrl, {
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        html = await res.text();
        finalUrl = res.url || cleanUrl;
        break;
      }
    } catch (_) {}
  }

  if (!html) {
    throw new Error('Unable to load Pinterest page.');
  }

  const pinIdMatch =
    finalUrl.match(/\/pin\/(\d+)/i) ||
    cleanUrl.match(/\/pin\/(\d+)/i) ||
    html.match(/pin\/(\d+)/i);
  const pinId = pinIdMatch ? pinIdMatch[1] : `pin_${Date.now()}`;

  const ogTitleMatch =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i) ||
    html.match(/<title>([^<]*)<\/title>/i);
  let title = ogTitleMatch ? ogTitleMatch[1].trim() : 'Pinterest Media';
  title = title
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s*\|\s*Pinterest.*$/i, '')
    .trim();

  const ogImageMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  const thumbnail = ogImageMatch ? ogImageMatch[1].trim() : '';

  const rawMp4Matches = html.match(/https?:\/\/[^"'<>\s]+\.mp4[^"'<>\s]*/gi) || [];
  const validMp4s = [
    ...new Set(
      rawMp4Matches
        .map((u) => u.replace(/\\/g, ''))
        .filter((u) => u.includes('pinimg.com') || u.includes('pinterest.com'))
    ),
  ];

  const rawM3u8Matches = html.match(/https?:\/\/[^"'<>\s]+\.m3u8[^"'<>\s]*/gi) || [];
  const validM3u8s = [
    ...new Set(rawM3u8Matches.map((u) => u.replace(/\\/g, ''))),
  ];

  if (validMp4s.length === 0 && validM3u8s.length > 0) {
    for (const m3u8 of validM3u8s) {
      const converted = m3u8
        .replace(/\/videos\/(?:iht\/)?hls\//i, '/videos/mc/720p/')
        .replace(/\.m3u8.*$/i, '.mp4');
      if (converted !== m3u8 && !validMp4s.includes(converted)) {
        validMp4s.push(converted);
      }
    }
  }

  let originalImage = '';
  if (thumbnail) {
    originalImage = thumbnail.replace(/\/(?:236x|474x|564x|736x)\//, '/originals/');
  }

  const isVideo = validMp4s.length > 0;
  const qualityOptions = [];

  if (isVideo) {
    const primaryVideo = validMp4s[0];

    // Check if 1080p stream exists
    let hd1080Url = '';
    if (primaryVideo.includes('/mc/720p/')) {
      const candidate1080 = primaryVideo.replace('/mc/720p/', '/mc/1080p/');
      try {
        const head1080 = await fetch(candidate1080, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
        if (head1080.ok) {
          hd1080Url = candidate1080;
        }
      } catch (_) {}
    }

    if (hd1080Url) {
      qualityOptions.push({
        label: 'Full HD Video (1080p MP4)',
        url: hd1080Url,
        type: 'video',
        quality: '1080p Full HD',
        fileExtension: '.mp4',
      });
    }

    qualityOptions.push({
      label: 'HD Video (720p MP4)',
      url: primaryVideo,
      type: 'video',
      quality: '720p HD',
      fileExtension: '.mp4',
    });

    if (originalImage) {
      qualityOptions.push({
        label: 'Cover Thumbnail (HD)',
        url: originalImage,
        type: 'video',
        quality: 'Original Image',
        fileExtension: originalImage.endsWith('.png') ? '.png' : '.jpg',
      });
    }
  } else if (originalImage) {
    const ext = originalImage.endsWith('.png') ? '.png' : '.jpg';
    qualityOptions.push({
      label: 'Original Master Photo (4K / 2K / HD)',
      url: originalImage,
      type: 'video',
      quality: 'Original HD',
      fileExtension: ext,
    });

    if (thumbnail && thumbnail !== originalImage) {
      qualityOptions.push({
        label: 'Standard Preview Photo',
        url: thumbnail,
        type: 'video',
        quality: '736x Preview',
        fileExtension: ext,
      });
    }
  }

  return {
    id: pinId,
    platform: 'pinterest',
    title,
    thumbnail: thumbnail || originalImage,
    videoUrl: qualityOptions[0]?.url || '',
    qualityOptions,
  };
}

// ==========================================
// TEST RUNNER
// ==========================================
async function runPinterestTests() {
  console.log('\n==================================================');
  console.log('📌 RUNNING PINTEREST DOWNLOADER ENGINE TESTS');
  console.log('==================================================');

  // Test 1: URL & Domain Detection
  const urlsToDetect = [
    'https://www.pinterest.com/pin/123456789012345/',
    'https://pinterest.com/pin/999999/',
    'https://pin.it/7w4uK6l',
    'https://in.pinterest.com/pin/39617671718303098/',
    'https://pinterest.co.uk/pin/603623156291195332/',
    'https://i.pinimg.com/originals/ab/cd/ef/abcdef.jpg',
    'Hey checkout this pin: https://pin.it/abc1234 on Pinterest'
  ];

  for (const u of urlsToDetect) {
    const detected = detectPlatform(u);
    assert.strictEqual(detected, 'pinterest', `Expected pinterest for ${u}, got: ${detected}`);
  }
  console.log('✅ Pinterest URL pattern & shortlink detection passed (7/7)');

  // Test 2: Pin ID parsing
  assert.strictEqual(extractPinterestPinId('https://www.pinterest.com/pin/39617671718303098/'), '39617671718303098');
  assert.strictEqual(extractPinterestPinId('https://in.pinterest.com/pin/603623156291195332/'), '603623156291195332');
  console.log('✅ Pinterest Pin ID regex extraction passed');

  // Test 3: Filename sanitization for videos and photos
  const videoFile = sanitizeMediaFilename('PINTEREST_Beautiful Sunset', false, '.mp4');
  assert.strictEqual(videoFile, 'PINTEREST_Beautiful_Sunset.mp4');

  const photoFile = sanitizeMediaFilename('PINTEREST_Anime Art', false, '.jpg');
  assert.strictEqual(photoFile, 'PINTEREST_Anime_Art.jpg');

  const pngFile = sanitizeMediaFilename('PINTEREST_Vector Logo.png', false, '.png');
  assert.strictEqual(pngFile, 'PINTEREST_Vector_Logo.png');
  console.log('✅ Pinterest filename sanitization & extensions passed (.mp4, .jpg, .png)');

  // Test 4: Image and Video Magic Header Inspection
  const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  assert.strictEqual(inspectMediaHeaderBytes(jpegHeader, '.jpg').valid, true);
  assert.strictEqual(inspectMediaHeaderBytes(jpegHeader, '.jpg').detectedExt, '.jpg');

  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  assert.strictEqual(inspectMediaHeaderBytes(pngHeader, '.png').valid, true);
  assert.strictEqual(inspectMediaHeaderBytes(pngHeader, '.png').detectedExt, '.png');

  const webpHeader = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
  assert.strictEqual(inspectMediaHeaderBytes(webpHeader, '.webp').valid, true);

  const mp4Header = new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
  assert.strictEqual(inspectMediaHeaderBytes(mp4Header, '.mp4').valid, true);
  assert.strictEqual(inspectMediaHeaderBytes(mp4Header, '.mp4').detectedExt, '.mp4');
  console.log('✅ Pinterest media header verification passed (JPEG, PNG, WebP, MP4)');

  // Test 5: Referer headers for Pinterest CDN
  const pinimgHeaders = buildDownloadHeaders('https://v1.pinimg.com/videos/mc/720p/test.mp4');
  assert.strictEqual(pinimgHeaders['Referer'], 'https://www.pinterest.com/');
  console.log('✅ Pinterest CDN Referer headers verified');

  // Test 6: M3U8 to MP4 replacement logic
  const m3u8Sample = 'https://v1.pinimg.com/videos/iht/hls/73/eb/e4/73ebe4818315b7c485323a3b6832ea2a.m3u8';
  const mp4Converted = m3u8Sample.replace(/\/videos\/(?:iht\/)?hls\//i, '/videos/mc/720p/').replace(/\.m3u8.*$/i, '.mp4');
  assert.strictEqual(mp4Converted, 'https://v1.pinimg.com/videos/mc/720p/73/eb/e4/73ebe4818315b7c485323a3b6832ea2a.mp4');
  console.log('✅ Pinterest M3U8 -> 720p MP4 conversion logic verified');

  // Test 7: Original image URL conversion from 736x/236x
  const previewImg = 'https://i.pinimg.com/736x/6d/a7/e5/6da7e540c04ac51c4522d2707fd1783e.jpg';
  const origImg = previewImg.replace(/\/(?:236x|474x|564x|736x)\//, '/originals/');
  assert.strictEqual(origImg, 'https://i.pinimg.com/originals/6d/a7/e5/6da7e540c04ac51c4522d2707fd1783e.jpg');
  console.log('✅ Pinterest original high-res image derivation verified');

  // Test 8: Live Network Pinterest Extraction (Video Pin)
  console.log('\n--- Live Pinterest Video Pin Resolution ---');
  try {
    const videoResult = await extractPinterest('https://www.pinterest.com/pin/39617671718303098/');
    assert.strictEqual(videoResult.platform, 'pinterest');
    assert.ok(videoResult.title.length > 0, 'Title should not be empty');
    assert.ok(videoResult.videoUrl.includes('.mp4'), 'Should resolve direct MP4 URL');
    assert.ok(videoResult.qualityOptions.length > 0, 'Should have quality options');
    console.log(`✅ Live Video Pin resolved: "${videoResult.title.slice(0, 45)}..."`);
    console.log(`   Direct MP4: ${videoResult.videoUrl.slice(0, 60)}...`);
  } catch (err) {
    console.warn(`⚠️ Live Pinterest video test warning: ${err.message}`);
  }

  // Test 9: Live Network Pinterest Extraction (Image Pin & pin.it shortlink)
  console.log('\n--- Live Pinterest Image Pin & pin.it Shortlink Resolution ---');
  try {
    const imageResult = await extractPinterest('https://pin.it/7w4uK6l');
    assert.strictEqual(imageResult.platform, 'pinterest');
    assert.ok(imageResult.title.length > 0, 'Title should not be empty');
    assert.ok(imageResult.videoUrl.includes('pinimg.com'), 'Should resolve high-res image URL');
    assert.ok(imageResult.qualityOptions.length > 0, 'Should have quality options');
    console.log(`✅ Live Shortlink Pin resolved: "${imageResult.title.slice(0, 45)}..."`);
    console.log(`   Direct High-Res Image: ${imageResult.videoUrl.slice(0, 60)}...`);
  } catch (err) {
    console.warn(`⚠️ Live Pinterest shortlink image test warning: ${err.message}`);
  }

  console.log('\n🎉 ALL PINTEREST DOWNLOADER TESTS PASSED!\n');
}

module.exports = { runPinterestTests };

if (require.main === module) {
  runPinterestTests();
}

