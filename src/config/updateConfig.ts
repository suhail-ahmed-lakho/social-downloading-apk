// Configuration for In-App Updates
// Lakho's team release channel configuration

export interface AppReleaseManifest {
  version: string;
  versionCode: number;
  releaseTitle: string;
  releaseDate: string;
  mandatory: boolean;
  downloadUrl: string;
  changelog: string[];
}

export const CURRENT_APP_VERSION = '1.0.1';
export const CURRENT_VERSION_CODE = 10001;

export const UPDATE_CONFIG = {
  // Current installed version
  currentVersion: CURRENT_APP_VERSION,
  currentVersionCode: CURRENT_VERSION_CODE,

  // Remote version check URL
  // You can host 'version.json' on GitHub (e.g. raw.githubusercontent.com) or any web server / CDN.
  // When you release a new APK, update the version number and APK link in that JSON.
  remoteManifestUrl: 'https://raw.githubusercontent.com/suhail-ahmed-lakho/social-downloading-apk/main/version.json',

  // GitHub repository if using GitHub Releases API (e.g. 'username/repo')
  githubRepo: 'suhail-ahmed-lakho/social-downloading-apk',

  // Check automatically when app opens
  checkOnLaunch: true,

  // Default fallback download URL (e.g. website, telegram, drive or github)
  defaultDownloadUrl: 'https://github.com/suhail-ahmed-lakho/social-downloading-apk/releases/latest',
};
