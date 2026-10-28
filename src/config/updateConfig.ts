// LookNow OmniSaver In-App Update Engine
// Private & Autonomous Update Channel:
// Updates are served directly from the LookNow website (looknow.cyou/api/version)
// No dependency on public GitHub repository visibility.

export interface AppReleaseManifest {
  version: string;
  versionCode: number;
  releaseTitle: string;
  releaseDate: string;
  fileSize?: string;
  fileSizeBytes?: number;
  mandatory: boolean;
  downloadUrl: string;
  changelog: string[];
}

export const CURRENT_APP_VERSION = '1.0.5';
export const CURRENT_VERSION_CODE = 10005;

export const UPDATE_CONFIG = {
  // Current installed app version
  currentVersion: CURRENT_APP_VERSION,
  currentVersionCode: CURRENT_VERSION_CODE,

  // Primary update endpoint (Self-hosted on LookNow SaaS)
  remoteManifestUrl: 'https://looknow.cyou/api/version',

  // Static fallback manifest endpoint
  fallbackManifestUrl: 'https://looknow.cyou/version.json',

  // Official APK download URL
  defaultDownloadUrl: 'https://looknow.cyou/api/download/apk',

  // Auto-check for updates on application launch
  checkOnLaunch: true,
};
