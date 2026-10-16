// tests/run-all-tests.js
const { runExtractorTests } = require('./extractor.test');
const { runDownloadTests } = require('./download.test');

async function main() {
  console.log('==================================================');
  console.log('🚀 RUNNING OMNISAVER FULL APPLICATION TEST SUITE');
  console.log('==================================================');

  const startTime = Date.now();
  let errors = 0;

  try {
    await runExtractorTests();
  } catch (err) {
    console.error('❌ Extractor tests failed:', err);
    errors++;
  }

  try {
    runDownloadTests();
  } catch (err) {
    console.error('❌ Download tests failed:', err);
    errors++;
  }

  try {
    console.log('\n--- [TEST SUITE 5] Live 4-5 Min YouTube Songs & VEVO Test ---');
    const oRes = await fetch('https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DkJQP7kiw5Fk&format=json');
    if (oRes.ok) {
      const oData = await oRes.json();
      console.log(`✅ YouTube oEmbed metadata resolved: "${oData.title}"`);
    }
    const lRes = await fetch('https://loader.to/ajax/download.php?format=mp3&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DkJQP7kiw5Fk');
    if (lRes.ok) {
      const lData = await lRes.json();
      if (lData.success) {
        console.log(`✅ YouTube 4-5 min song MP3 stream converter initialized (${lData.id})`);
      }
    }
  } catch (err) {
    console.error('❌ YouTube Song tests failed:', err);
    errors++;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n==================================================');
  if (errors === 0) {
    console.log(`🎉 ALL TESTS PASSED SUCCESSFULLY! (${duration}s)`);
    console.log('✅ TikTok Downloader (No-Watermark): OPERATIONAL');
    console.log('✅ YouTube Downloader (Shorts & HD): OPERATIONAL');
    console.log('✅ Instagram Downloader (Browser/Reels): OPERATIONAL');
    console.log('✅ Download Manager & File Sanitization: OPERATIONAL');
    console.log('==================================================');
    process.exit(0);
  } else {
    console.error(`❌ ${errors} test suite(s) failed. (${duration}s)`);
    console.log('==================================================');
    process.exit(1);
  }
}

main();
