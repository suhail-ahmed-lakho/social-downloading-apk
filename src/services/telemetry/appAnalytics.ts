import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_APP_VERSION } from '../../config/updateConfig';

const PRIMARY_TELEMETRY = 'https://social-downloading-apk.suhaillakho3.workers.dev/api/track/visit';
const FALLBACK_TELEMETRY = 'https://looknow.cyou/api/track/visit';
const INSTALLATION_KEY = '@omnisaver_anonymous_user_id';

let cachedUserId: string | null = null;

export async function getOrCreateUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  try {
    const existing = await AsyncStorage.getItem(INSTALLATION_KEY);
    if (existing) {
      cachedUserId = existing;
      return existing;
    }
    const newId = `OMNI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await AsyncStorage.setItem(INSTALLATION_KEY, newId);
    cachedUserId = newId;
    return newId;
  } catch {
    return `OMNI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
}

async function postWithFallback(payload: Record<string, any>): Promise<void> {
  const jsonBody = JSON.stringify(payload);
  try {
    const res = await fetch(PRIMARY_TELEMETRY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonBody,
    });
    if (res.ok) return;
  } catch (_) {}

  // Fallback host
  try {
    await fetch(FALLBACK_TELEMETRY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonBody,
    });
  } catch (_) {}
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

    const guestSuffix = userId.replace(/[^A-Z0-9]/g, '').slice(-4).toUpperCase() || '2026';
    const guestName = `Guest #${guestSuffix}`;

    void postWithFallback({
      isApp: true,
      source: 'mobile_app',
      platform: 'mobile-app',
      deviceId: userId,
      action: 'visit',
      name: guestName,
      userName: guestName,
      appVersion: CURRENT_APP_VERSION,
      device,
      details: `Launched OmniSaver Mobile App v${CURRENT_APP_VERSION}`,
    });
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

    const guestSuffix = userId.replace(/[^A-Z0-9]/g, '').slice(-4).toUpperCase() || '2026';
    const guestName = `Guest #${guestSuffix}`;

    void postWithFallback({
      isApp: true,
      source: 'mobile_app',
      platform: platform || 'universal',
      deviceId: userId,
      action: 'download',
      name: guestName,
      userName: guestName,
      appVersion: CURRENT_APP_VERSION,
      device,
      details: `Saved ${(platform || 'Media').toUpperCase()} ${quality || 'HD'} (${format})`,
    });
  } catch {}
}

