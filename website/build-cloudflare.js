const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('==============================================');
console.log('🚀 LookNow Cloudflare Automated Build Starting...');
console.log('==============================================\n');

const websiteDir = __dirname;
const workerPath = path.join(websiteDir, '.open-next', 'worker.js');
const wranglerPath = path.join(websiteDir, 'wrangler.jsonc');

// 1. Ensure wrangler.jsonc has the exact correct matching worker name
const wranglerConfig = {
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "social-downloading-apk",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-10-19",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "social-downloading-apk"
    }
  ],
  "observability": {
    "enabled": true
  }
};
fs.writeFileSync(wranglerPath, JSON.stringify(wranglerConfig, null, 2), 'utf8');
console.log('✅ Synchronized wrangler.jsonc with worker name: social-downloading-apk');

// 2. Remove open-next.config.ts if present to prevent missing module errors
const openNextConfigPath = path.join(websiteDir, 'open-next.config.ts');
if (fs.existsSync(openNextConfigPath)) {
  fs.unlinkSync(openNextConfigPath);
  console.log('🧹 Cleaned up optional open-next.config.ts for auto-configuration');
}

// 3. Run OpenNext Cloudflare Build
console.log('\n📦 Compiling Next.js & bundling Cloudflare Worker...');
try {
  execSync('npx @opennextjs/cloudflare build', {
    cwd: websiteDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
} catch (err) {
  console.error('❌ OpenNext build failed:', err.message);
  process.exit(1);
}

// 4. Verify entrypoint
if (fs.existsSync(workerPath)) {
  console.log('\n==============================================');
  console.log('🎉 Cloudflare Worker bundle verified: .open-next/worker.js');
  console.log('🚀 Ready for Wrangler Edge deployment!');
  console.log('==============================================\n');
} else {
  console.error('❌ Error: .open-next/worker.js was not generated!');
  process.exit(1);
}
