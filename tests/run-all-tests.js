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
