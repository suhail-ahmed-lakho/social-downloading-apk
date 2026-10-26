import AsyncStorage from '@react-native-async-storage/async-storage';
import { UPDATE_CONFIG, CURRENT_APP_VERSION, AppReleaseManifest } from '../../config/updateConfig';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  isMandatory: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTitle: string;
  releaseDate?: string;
  fileSize?: string;
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
 * Check for updates from LookNow website API (Independent of GitHub visibility)
 */
export async function checkForAppUpdates(forceCheck: boolean = false): Promise<UpdateCheckResult> {
  const currentVersion = CURRENT_APP_VERSION;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    let manifest: AppReleaseManifest | null = null;

    // Check LookNow SaaS update endpoints
    const candidateUrls = [
      UPDATE_CONFIG.remoteManifestUrl,
      UPDATE_CONFIG.fallbackManifestUrl,
    ];

    for (const manifestUrl of candidateUrls) {
      if (!manifestUrl) continue;
      try {
        const response = await fetch(manifestUrl, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          manifest = await response.json();
          if (manifest && manifest.version) break;
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
            downloadUrl: manifest.downloadUrl || UPDATE_CONFIG.defaultDownloadUrl,
            fileSize: manifest.fileSize || '15.4 MB',
            changelog: manifest.changelog || [],
          };
        }
      }

      return {
        hasUpdate,
        isMandatory: !!manifest.mandatory,
        currentVersion,
        latestVersion: manifest.version,
        releaseTitle: manifest.releaseTitle || `OmniSaver v${manifest.version}`,
        releaseDate: manifest.releaseDate,
        downloadUrl: manifest.downloadUrl || UPDATE_CONFIG.defaultDownloadUrl,
        fileSize: manifest.fileSize || '15.4 MB',
        changelog: Array.isArray(manifest.changelog) && manifest.changelog.length > 0
          ? manifest.changelog
          : ['Performance improvements and latest video stream engine optimizations.'],
      };
    }
  } catch (err) {
    console.warn('Update check failed:', err);
  }

  return {
    hasUpdate: false,
    isMandatory: false,
    currentVersion,
    latestVersion: currentVersion,
    releaseTitle: `OmniSaver v${currentVersion}`,
    downloadUrl: UPDATE_CONFIG.defaultDownloadUrl,
    changelog: [],
  };
}

/**
 * Remember dismissed update version
 */
export async function dismissUpdateVersion(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISSED_UPDATE_KEY, version);
  } catch (_) {}
}
