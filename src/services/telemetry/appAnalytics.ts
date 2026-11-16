import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_APP_VERSION } from '../../config/updateConfig';

const TELEMETRY_ENDPOINT = 'https://looknow.cyou/api/track/visit';
const INSTALLATION_KEY = '@omnisaver_anonymous_user_id';

let cachedUserId: string | null = null;

async function getOrCreateUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  try {
    const existing = await AsyncStorage.getItem(INSTALLATION_KEY);
    if (existing) {
      cachedUserId = existing;
      return existing;
    }
    const newId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await AsyncStorage.setItem(INSTALLATION_KEY, newId);
    cachedUserId = newId;
    return newId;
  } catch {
    return `guest_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export async function trackAppLaunch(): Promise<void> {
  try {
    const userId = await getOrCreateUserId();
    const device =
      Platform.OS === 'android'
        ? 'Android Mobile'
        : Platform.OS === 'ios'
        ? 'iOS iPhone'
        : 'Web App';

    void fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isApp: true,
        platform: 'mobile-app',
        action: 'visit',
        name: `App User (${userId.slice(-6)})`,
        appVersion: CURRENT_APP_VERSION,
        device,
        details: `Launched OmniSaver Mobile App v${CURRENT_APP_VERSION}`,
      }),
    }).catch(() => {});
  } catch {}
}

export async function trackAppDownload(platform: string, quality: string, format = 'video'): Promise<void> {
  try {
    const userId = await getOrCreateUserId();
    const device =
      Platform.OS === 'android'
        ? 'Android Mobile'
        : Platform.OS === 'ios'
        ? 'iOS iPhone'
        : 'Web App';

    void fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isApp: true,
        platform: 'mobile-app',
        action: 'download',
        name: `App User (${userId.slice(-6)})`,
        appVersion: CURRENT_APP_VERSION,
        device,
        details: `Saved ${platform.toUpperCase()} ${quality || ''} (${format})`,
      }),
    }).catch(() => {});
  } catch {}
}
