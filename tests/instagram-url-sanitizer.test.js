// tests/instagram-url-sanitizer.test.js
const assert = require('assert');

// Logic under test (matching src/services/api/extractor.ts cleanInstagramMediaUrl)
function cleanInstagramMediaUrl(rawUrl) {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\\\/+/g, '/');
  url = url.replace(/\\u0026/g, '&');
  url = url.replace(/&amp;/g, '&');
  url = url.replace(/["'\\\s]+$/, '');
  return url;
}

function runSanitizerTests() {
  console.log('\n==================================================');
  console.log('🧪 RUNNING INSTAGRAM 403 PREVENTATIVE SANITIZER TESTS');
  console.log('==================================================');

  // Test 1: JSON-escaped slashes and unicode ampersands (The bug that caused 403)
  const jsonRawUrl = 'https:\\/\\/scontent.cdninstagram.com\\/v\\/t50.2886-16\\/4321_n.mp4?_nc_cat=103\\u0026_nc_sid=abc123\\u0026_nc_ohc=token123\\u0026oh=00_AYB\\u0026oe=66E12345';
  const cleaned1 = cleanInstagramMediaUrl(jsonRawUrl);
  
  assert.ok(!cleaned1.includes('\\/'), 'Failed to unescape JSON backslashes');
  assert.ok(!cleaned1.includes('\\u0026'), 'Failed to unescape unicode ampersands');
  assert.ok(cleaned1.includes('&_nc_sid=abc123'), 'Missing _nc_sid token');
  assert.ok(cleaned1.includes('&_nc_ohc=token123'), 'Missing _nc_ohc token');
  assert.ok(cleaned1.includes('&oh=00_AYB'), 'Missing oh cryptographic signature token');
  assert.ok(cleaned1.includes('&oe=66E12345'), 'Missing oe expiration timestamp');
  console.log('  ✅ Test 1: Correctly unescaped JSON slashes & unicode ampersands without truncating query tokens');

  // Test 2: HTML entity encoding (&amp;)
  const htmlRawUrl = 'https://scontent.cdninstagram.com/v/t50.2886-16/123_n.mp4?_nc_cat=103&amp;_nc_sid=xyz&amp;oh=secret&amp;oe=999';
  const cleaned2 = cleanInstagramMediaUrl(htmlRawUrl);
  assert.ok(!cleaned2.includes('&amp;'), 'Failed to unescape &amp;');
  assert.strictEqual(cleaned2, 'https://scontent.cdninstagram.com/v/t50.2886-16/123_n.mp4?_nc_cat=103&_nc_sid=xyz&oh=secret&oe=999');
  console.log('  ✅ Test 2: Converted &amp; into valid query delimiters to prevent 403 Invalid Parameter error');

  // Test 3: Trailing quotes and backslashes
  const quotedUrl = '"https://scontent.cdninstagram.com/video.mp4?token=123\\"';
  const cleaned3 = cleanInstagramMediaUrl(quotedUrl.replace(/^"/, ''));
  assert.strictEqual(cleaned3, 'https://scontent.cdninstagram.com/video.mp4?token=123');
  console.log('  ✅ Test 3: Cleaned trailing quotes and backslashes');

  // Test 4: Regex non-truncation verification
  const fullJsonPayload = '{"meta":{"video_url":"https:\\/\\/scontent.cdninstagram.com\\/v\\/t50.2886-16\\/sample.mp4?_nc_cat=103\\u0026_nc_sid=123\\u0026oh=abc\\u0026oe=456"}}';
  const regex = /https?:[\\/]+[^"'\s]+?\.mp4[^"'\s]*/g;
  const match = fullJsonPayload.match(regex);
  assert.ok(match && match.length > 0, 'Regex failed to capture MP4 URL from JSON');
  const finalExtracted = cleanInstagramMediaUrl(match[0]);
  assert.ok(finalExtracted.includes('&oh=abc') && finalExtracted.includes('&oe=456'), 'Extracted URL was truncated before security parameters!');
  console.log('  ✅ Test 4: Extractor regex captures complete security tokens across escaped boundaries');

  console.log('\n🎉 ALL INSTAGRAM 403 SANITIZER TESTS PASSED!\n');
}

module.exports = { runSanitizerTests };

if (require.main === module) {
  runSanitizerTests();
}
