const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const websiteDir = __dirname;
const workerPath = path.join(websiteDir, '.open-next', 'worker.js');
const wranglerPath = path.join(websiteDir, 'wrangler.jsonc');

// Guard: When OpenNext runs the build script to compile Next.js, run next build directly
if (process.env.OPEN_NEXT_SUBPROCESS === '1') {
  console.log('⚡ OpenNext sub-process: Compiling Next.js via "next build"...');
  try {
    execSync('npx next build', {
      cwd: websiteDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    process.exit(0);
  } catch (err) {
    console.error('❌ Next.js compilation failed:', err.message);
    process.exit(1);
  }
}

console.log('==============================================');
console.log('🚀 LookNow Cloudflare Automated Build Starting...');
console.log('==============================================\n');

// 1. Ensure wrangler.jsonc has the exact correct matching worker name
const wranglerConfig = {
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "webiste-saas-social",
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
      "service": "webiste-saas-social"
    }
  ],
  "observability": {
    "enabled": true
  }
};
fs.writeFileSync(wranglerPath, JSON.stringify(wranglerConfig, null, 2), 'utf8');
console.log('✅ Synchronized wrangler.jsonc with worker name: webiste-saas-social');

// 2. Ensure open-next.config.ts exists with defineCloudflareConfig
const openNextConfigPath = path.join(websiteDir, 'open-next.config.ts');
fs.writeFileSync(
  openNextConfigPath,
  'import { defineCloudflareConfig } from "@opennextjs/cloudflare";\n\nexport default {\n  ...defineCloudflareConfig({}),\n  buildCommand: "npm run build:next",\n};\n',
  'utf8'
);
console.log('✅ Synchronized self-contained open-next.config.ts');

// 3. Run OpenNext Cloudflare Build
console.log('\n📦 Compiling Next.js & bundling Cloudflare Worker...');
try {
  execSync('npx @opennextjs/cloudflare build', {
    cwd: websiteDir,
    stdio: 'inherit',
    env: { ...process.env, OPEN_NEXT_SUBPROCESS: '1', NODE_ENV: 'production' }
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
