// tests/download.test.js
const assert = require('assert');

function cleanFilename(raw, isAudio = false) {
  const cleanName = raw.replace(/[^a-zA-Z0-9._-]/g, '_');
  const extension = isAudio ? '.mp3' : '.mp4';
  return cleanName.endsWith(extension) ? cleanName : `${cleanName}${extension}`;
}

function calculateProgress(written, total) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((written / total) * 100));
}

function validateHistoryItem(item) {
  assert.ok(item.id, 'Item must have an id');
  assert.ok(['tiktok', 'instagram', 'youtube', 'unknown'].includes(item.platform), 'Platform must be valid');
  assert.ok(item.title, 'Item must have a title');
  assert.ok(item.localUri, 'Item must have a local file uri');
  assert.strictEqual(typeof item.createdAt, 'number', 'createdAt must be a timestamp');
  return true;
}

function runDownloadTests() {
  console.log('\n--- [TEST SUITE 4] Download Manager & Filename Logic ---');

  // Test filename cleaning
  const name1 = cleanFilename('Amazing Video! (1080p) #fyp', false);
  assert.strictEqual(name1, 'Amazing_Video___1080p___fyp.mp4');
  console.log('✅ Video filename sanitization passed');

  const name2 = cleanFilename('Cool Audio Song: Summer.mp3', true);
  assert.strictEqual(name2, 'Cool_Audio_Song__Summer.mp3');
  console.log('✅ Audio filename sanitization passed');

  // Test progress calculations
  assert.strictEqual(calculateProgress(0, 1000), 0);
  assert.strictEqual(calculateProgress(500, 1000), 50);
  assert.strictEqual(calculateProgress(1000, 1000), 100);
  assert.strictEqual(calculateProgress(1500, 1000), 100); // Clamped to 100
  assert.strictEqual(calculateProgress(100, 0), 0); // No division by zero
  console.log('✅ Download progress calculator passed');

  // Test history item validation
  const sampleHistoryItem = {
    id: 'test_12345',
    platform: 'tiktok',
    title: 'Dance Challenge Video',
    author: '@creators',
    thumbnail: 'https://example.com/thumb.jpg',
    localUri: 'file:///data/user/0/app/media.mp4',
    originalUrl: 'https://www.tiktok.com/@user/video/123',
    fileSize: 10485760,
    createdAt: Date.now(),
  };

  assert.strictEqual(validateHistoryItem(sampleHistoryItem), true);
  console.log('✅ History record structure validation passed');
}

module.exports = { runDownloadTests };
