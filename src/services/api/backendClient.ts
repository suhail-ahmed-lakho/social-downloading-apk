import { Platform } from 'react-native';
import { getOrCreateUserId } from '../telemetry/appAnalytics';

export const PRIMARY_BACKEND_URL = 'https://social-downloading-apk.suhaillakho3.workers.dev';
export const FALLBACK_BACKEND_URL = 'https://looknow.cyou';
export const BACKEND_BASE_URL = PRIMARY_BACKEND_URL;

async function fetchBackendWithFallback(
  path: string,
  options: RequestInit,
  timeoutMs = 6000
): Promise<Response> {
  const hosts = [PRIMARY_BACKEND_URL, FALLBACK_BACKEND_URL];
  let lastError: any = null;

  for (const host of hosts) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${host}${path}`, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status < 500) {
        return res;
      }
      lastError = new Error(`Server returned ${res.status}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All backend endpoints failed');
}

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

// Fetch live remote configuration from backend API with dual-host fallback
export async function fetchRemoteAppConfig(): Promise<RemoteAppConfig | null> {
  try {
    const res = await fetchBackendWithFallback(
      '/api/app/config',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OmniSaver-Mobile-App',
        },
      },
      6000
    );

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

// Verify License Key or Transaction ID (TID) with central backend database
export async function verifyLicenseWithBackend(
  code: string,
  deviceId: string,
  planType?: 'monthly' | 'quarterly' | 'yearly',
  senderPhone?: string
): Promise<{
  valid: boolean;
  planType?: 'monthly' | 'quarterly' | 'yearly';
  expiresAt?: number;
  message?: string;
  error?: string;
}> {
  try {
    const finalDevId = deviceId || (await getOrCreateUserId());
    const res = await fetchBackendWithFallback(
      '/api/app/license/verify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          code,
          key: code,
          tid: code,
          deviceId: finalDevId,
          planType,
          senderPhone,
        }),
      },
      7000
    );

    if (res.ok) {
      const data = await res.json();
      return {
        valid: Boolean(data.valid),
        planType: data.planType,
        expiresAt: data.expiresAt,
        message: data.message,
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
    const devId = payload.deviceId || (await getOrCreateUserId());
    void fetchBackendWithFallback(
      '/api/app/telemetry',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'mobile_app',
          appVersion: payload.appVersion || '1.0.16',
          os: Platform.OS,
          ...payload,
          deviceId: devId,
        }),
      },
      5000
    ).catch(() => {});
  } catch (_) {}
}
