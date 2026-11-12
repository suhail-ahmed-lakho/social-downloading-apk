const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Read package.json
const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// 2. Determine new version
const currentVersion = pkg.version || '1.0.0';
const argVersion = process.argv[2];

let newVersion;
if (argVersion && /^\d+\.\d+\.\d+$/.test(argVersion)) {
  newVersion = argVersion;
} else {
  // Auto-increment patch version (1.0.0 -> 1.0.1)
  const parts = currentVersion.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  newVersion = parts.join('.');
}

console.log(`\n==============================================`);
console.log(`🚀 AUTOMATIC RELEASE: v${currentVersion} ➔ v${newVersion}`);
console.log(`==============================================\n`);

// 3. Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`✅ Updated package.json: v${newVersion}`);

// 4. Update app.json
const appJsonPath = path.join(__dirname, '..', 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  if (appJson.expo) {
    appJson.expo.version = newVersion;
    if (appJson.expo.android) {
      const parts = newVersion.split('.').map(Number);
      appJson.expo.android.versionCode = (parts[0] * 10000) + (parts[1] * 100) + parts[2];
    }
  }
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated app.json: v${newVersion}`);
}

// 5. Update version.json
const versionJsonPath = path.join(__dirname, '..', 'version.json');
const today = new Date().toISOString().split('T')[0];
const parts = newVersion.split('.').map(Number);
const vCode = (parts[0] * 10000) + (parts[1] * 100) + parts[2];

const versionManifest = {
  version: newVersion,
  versionCode: vCode,
  releaseTitle: `OmniSaver v${newVersion} - Lakho's Team Official Release`,
  releaseDate: today,
  fileSize: '33.7 MB',
  fileSizeBytes: 35338561,
  mandatory: false,
  downloadUrl: 'https://looknow.cyou/api/download/apk',
  changelog: [
    `OmniSaver v${newVersion} - Official Release by Lakho's Team`,
    'YouTube Playback & Corrupt Song Fix: Defaulted YouTube videos to universally compatible 1080p H.264, added clean faststart M4A HD song audio + container integrity checks & automatic stream recovery',
    'Live Progress & Remaining MB on Chunked Streams: Estimated %, remaining MB & ETA now track smoothly even when media servers omit Content-Length',
    'Refreshed Bottom Navbar: Smooth coral-pink gradient active capsule pill with high-contrast badge replacing the boxy square highlight',
    'Silent Zero-Prompt Gallery Saving: Eliminated Android "Allow OmniSaver to modify this video?" popup after downloads complete',
    'Refreshed Edge-to-Edge App Icon & Short Name: Clean borderless gradient icon without dark halo and clean "OmniSaver" launcher title',
    'True Background Downloading: Native Android Foreground Service & UIDT transfers continue downloading cleanly in the background'
  ]
};
fs.writeFileSync(versionJsonPath, JSON.stringify(versionManifest, null, 2) + '\n', 'utf8');
console.log(`✅ Updated version.json: v${newVersion}`);

// 5b. Update website/public/version.json
const websiteVersionPath = path.join(__dirname, '..', 'website', 'public', 'version.json');
if (fs.existsSync(path.dirname(websiteVersionPath))) {
  fs.writeFileSync(websiteVersionPath, JSON.stringify(versionManifest, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated website/public/version.json: v${newVersion}`);
}

// 6. Update src/config/updateConfig.ts
const configPath = path.join(__dirname, '..', 'src', 'config', 'updateConfig.ts');
if (fs.existsSync(configPath)) {
  let configContent = fs.readFileSync(configPath, 'utf8');
  configContent = configContent.replace(
    /export const CURRENT_APP_VERSION = ['"][^'"]+['"];/,
    `export const CURRENT_APP_VERSION = '${newVersion}';`
  );
  configContent = configContent.replace(
    /export const CURRENT_VERSION_CODE = \d+;/,
    `export const CURRENT_VERSION_CODE = ${vCode};`
  );
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log(`✅ Updated updateConfig.ts: v${newVersion}`);
}

// 7. Git commit, tag, and push
try {
  console.log('\n📦 Staging files for Git...');
  execSync('git add .', { stdio: 'inherit' });

  console.log(`📝 Creating commit for v${newVersion}...`);
  execSync(`git commit -m "Release v${newVersion} - by Lakho's team"`, { stdio: 'inherit' });

  console.log(`🏷️ Creating Git tag v${newVersion}...`);
  execSync(`git tag v${newVersion}`, { stdio: 'inherit' });

  console.log('🌐 Pushing to GitHub (origin master with tags)...');
  execSync('git push origin master --tags', { stdio: 'inherit' });

  console.log(`\n🎉 RELEASE v${newVersion} SUCCESSFULLY PUSHED TO GITHUB!`);
  console.log(`Users will now automatically receive the update popup on their devices!\n`);
} catch (gitErr) {
  console.error('Git execution warning:', gitErr.message);
}
