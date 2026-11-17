import { Platform } from 'react-native';

export const BACKEND_BASE_URL = 'https://looknow.cyou';

export interface RemotePaymentDetails {
  easypaisa: { title: string; accountNo: string };
  nayapay: { title: string; accountId: string };
  bankIban: { bank: string; title: string; iban: string };
  whatsappNumber: string;
}

export interface RemoteAdConfig {
  adsEnabled: boolean;
  bannerEnabled: boolean;
  interstitialEnabled: boolean;
  rewardedEnabled: boolean;
  interstitialInterval: number;
}

export interface RemoteVersionConfig {
  latestVersion: string;
  versionCode: number;
  apkDownloadUrl: string;
  forceUpdate: boolean;
  releaseNotes: string[];
}

export interface RemoteAppConfig {
  paymentDetails: RemotePaymentDetails;
  adConfig: RemoteAdConfig;
  versionConfig: RemoteVersionConfig;
  proPricing: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
}

let cachedRemoteConfig: RemoteAppConfig | null = null;

// Fetch live remote configuration from backend API
export async function fetchRemoteAppConfig(): Promise<RemoteAppConfig | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${BACKEND_BASE_URL}/api/app/config`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'OmniSaver-Mobile-App',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      cachedRemoteConfig = data;
      return data;
    }
  } catch (err) {
    // Non-fatal, offline fallback
  }
  return cachedRemoteConfig;
}

export function getCachedRemoteConfig(): RemoteAppConfig | null {
  return cachedRemoteConfig;
}

// Verify License Key with central backend database
export async function verifyLicenseWithBackend(
  key: string,
  deviceId: string
): Promise<{ valid: boolean; planType?: 'monthly' | 'quarterly' | 'yearly'; expiresAt?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`${BACKEND_BASE_URL}/api/app/license/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ key, deviceId }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      return {
        valid: Boolean(data.valid),
        planType: data.planType,
        expiresAt: data.expiresAt,
        error: data.error,
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        valid: false,
        error: errData.error || 'License verification rejected by server.',
      };
    }
  } catch (err: any) {
    return {
      valid: false,
      error: 'NETWORK_OFFLINE',
    };
  }
}

// Send lightweight privacy-safe mobile telemetry
export async function sendMobileTelemetry(payload: {
  action: 'heartbeat' | 'download' | 'extract' | 'login';
  platform?: string;
  deviceId?: string;
  isPro?: boolean;
  details?: string;
  appVersion?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    fetch(`${BACKEND_BASE_URL}/api/app/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'mobile_app',
        appVersion: payload.appVersion || '1.0.16',
        os: Platform.OS,
        ...payload,
      }),
    }).catch(() => {});
  } catch (_) {}
}
