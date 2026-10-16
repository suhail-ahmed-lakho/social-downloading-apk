import AsyncStorage from '@react-native-async-storage/async-storage';
import { UPDATE_CONFIG, CURRENT_APP_VERSION, AppReleaseManifest } from '../../config/updateConfig';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  isMandatory: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTitle: string;
  releaseDate?: string;
  downloadUrl: string;
  changelog: string[];
}

const DISMISSED_UPDATE_KEY = '@omnisaver_dismissed_update_version';

/**
 * Compare two semver strings (e.g. "1.1.0" > "1.0.0")
 * Returns:
 *  1 if a > b
 * -1 if a < b
 *  0 if a === b
 */
export function compareVersions(a: string, b: string): number {
  const cleanA = a.replace(/[^0-9.]/g, '').split('.').map((n) => parseInt(n || '0', 10));
  const cleanB = b.replace(/[^0-9.]/g, '').split('.').map((n) => parseInt(n || '0', 10));

  const maxLength = Math.max(cleanA.length, cleanB.length);
  for (let i = 0; i < maxLength; i++) {
    const valA = cleanA[i] || 0;
    const valB = cleanB[i] || 0;
    if (valA > valB) return 1;
    if (valA < valB) return -1;
  }
  return 0;
}

/**
 * Check for updates from remote manifest or GitHub API
 */
export async function checkForAppUpdates(forceCheck: boolean = false): Promise<UpdateCheckResult> {
  const currentVersion = CURRENT_APP_VERSION;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    let manifest: AppReleaseManifest | null = null;

    // 1. Check GitHub Releases API directly (100% automated from GitHub releases)
    if (UPDATE_CONFIG.githubRepo) {
      try {
        const ghRes = await fetch(
          `https://api.github.com/repos/${UPDATE_CONFIG.githubRepo}/releases/latest`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'OmniSaver-LakhoTeam',
            },
          }
        );

        if (ghRes.ok) {
          const ghData = await ghRes.json();
          const tag = (ghData.tag_name || ghData.name || '').replace(/^[vV]/, '');
          const apkAsset = ghData.assets?.find((a: any) => a.name?.toLowerCase().endsWith('.apk'));

          manifest = {
            version: tag || '1.0.0',
            versionCode: 1,
            releaseTitle: ghData.name || `OmniSaver v${tag}`,
            releaseDate: ghData.published_at?.split('T')[0] || '',
            mandatory: false,
            // If direct APK asset is uploaded to the release, download it directly, otherwise release page
            downloadUrl: apkAsset?.browser_download_url || ghData.html_url || UPDATE_CONFIG.defaultDownloadUrl,
            changelog: ghData.body
              ? ghData.body.split('\n').filter((l: string) => l.trim().length > 0)
              : ['New features and bug fixes by Lakho\'s team.'],
          };
        }
      } catch (_) {}
    }

    // 2. Fallback: Check remote version.json manifest if GitHub API didn't return
    if (!manifest) {
      try {
        const response = await fetch(UPDATE_CONFIG.remoteManifestUrl, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        if (response.ok) {
          manifest = await response.json();
        }
      } catch (_) {}
    }

    clearTimeout(timer);

    if (manifest && manifest.version) {
      const hasUpdate = compareVersions(manifest.version, currentVersion) > 0;

      // If user previously dismissed this exact version and it's not forced or mandatory, skip popup
      if (hasUpdate && !forceCheck && !manifest.mandatory) {
        const dismissedVersion = await AsyncStorage.getItem(DISMISSED_UPDATE_KEY);
        if (dismissedVersion === manifest.version) {
          return {
            hasUpdate: false,
            isMandatory: false,
            currentVersion,
            latestVersion: manifest.version,
            releaseTitle: manifest.releaseTitle,
            downloadUrl: manifest.downloadUrl,
            changelog: manifest.changelog || [],
          };
        }
      }

      return {
        hasUpdate,
        isMandatory: !!manifest.mandatory,
        currentVersion,
        latestVersion: manifest.version,
        releaseTitle: manifest.releaseTitle || `Update v${manifest.version}`,
        releaseDate: manifest.releaseDate,
        downloadUrl: manifest.downloadUrl || UPDATE_CONFIG.defaultDownloadUrl,
        changelog: Array.isArray(manifest.changelog)
          ? manifest.changelog
          : ['Performance enhancements and latest updates.'],
      };
    }
  } catch (error) {
    console.warn('Update check failed:', error);
  }

  return {
    hasUpdate: false,
    isMandatory: false,
    currentVersion,
    latestVersion: currentVersion,
    releaseTitle: 'Latest Version',
    downloadUrl: UPDATE_CONFIG.defaultDownloadUrl,
    changelog: [],
  };
}

/**
 * Dismiss a specific update version so it doesn't repeatedly show on every launch
 */
export async function dismissUpdateVersion(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISSED_UPDATE_KEY, version);
  } catch (_) {}
}
