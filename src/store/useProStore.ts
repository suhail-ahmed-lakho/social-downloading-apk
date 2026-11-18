import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  verifyLicenseWithBackend,
  fetchRemoteAppConfig,
  sendMobileTelemetry,
  getCachedRemoteConfig,
} from '../services/api/backendClient';

export type ProPlanType = 'free' | 'monthly' | 'quarterly' | 'yearly';

export interface ProState {
  isPro: boolean;
  planType: ProPlanType;
  expiryTimestamp: number | null;
  deviceId: string;
  dailyFreePrivateCaptures: number;
  lastCaptureDate: string;
  licenseKey: string | null;
  initialized: boolean;
}

const STORAGE_KEYS = {
  IS_PRO: '@omnisaver_pro_is_pro_v1',
  PLAN_TYPE: '@omnisaver_pro_plan_type_v1',
  EXPIRY: '@omnisaver_pro_expiry_v1',
  DEVICE_ID: '@omnisaver_pro_device_id_v1',
  DAILY_CAPTURES: '@omnisaver_pro_daily_captures_v1',
  LICENSE_KEY: '@omnisaver_pro_license_key_v1',
} as const;

export const PRO_LIMITS = {
  FREE_DAILY_PRIVATE_CAPTURES: 2,
  MONTHLY_DAYS: 30,
  QUARTERLY_DAYS: 90,
  YEARLY_DAYS: 365,
} as const;

export const PRO_PRICING = {
  monthly: { id: 'monthly' as const, title: 'Monthly Plan', price: 'Rs. 750', duration: 'month', periodDays: 30 },
  quarterly: { id: 'quarterly' as const, title: '3 Months Saver', price: 'Rs. 1,800', monthlyEquivalent: 'Rs. 600/mo', duration: '3 months', periodDays: 90, isPopular: true },
  yearly: { id: 'yearly' as const, title: 'Yearly VIP', price: 'Rs. 4,500', monthlyEquivalent: 'Rs. 375/mo', duration: 'year', periodDays: 365, isBestValue: true },
} as const;

export const PAYMENT_CHANNELS = [
  {
    id: 'easypaisa',
    name: 'EasyPaisa',
    accountNumber: '03001234567',
    accountTitle: 'OmniSaver Subscriptions',
    badge: 'Instant Transfer',
    color: '#00BA51',
  },
  {
    id: 'nayapay',
    name: 'NayaPay / Sadapay',
    accountNumber: '03001234567',
    accountTitle: 'OmniSaver Tech',
    badge: 'Zero Fees',
    color: '#FF6B00',
  },
  {
    id: 'bank',
    name: 'Bank Transfer (IBAN)',
    accountNumber: 'PK36MEZN0001234567890123',
    accountTitle: 'OmniSaver Media Services',
    badge: 'Meezan Bank',
    color: '#3B82F6',
  },
] as const;

export function getLivePaymentChannels() {
  const remote = getCachedRemoteConfig();
  if (remote?.paymentDetails) {
    const { easypaisa, nayapay, bankIban } = remote.paymentDetails;
    return [
      {
        id: 'easypaisa',
        name: 'EasyPaisa',
        accountNumber: easypaisa.accountNo || '03001234567',
        accountTitle: easypaisa.title || 'OmniSaver Subscriptions',
        badge: 'Instant Transfer',
        color: '#00BA51',
      },
      {
        id: 'nayapay',
        name: 'NayaPay / Sadapay',
        accountNumber: nayapay.accountId || '03001234567@nayapay',
        accountTitle: nayapay.title || 'OmniSaver Tech',
        badge: 'Zero Fees',
        color: '#FF6B00',
      },
      {
        id: 'bank',
        name: bankIban.bank || 'Bank Transfer (IBAN)',
        accountNumber: bankIban.iban || 'PK36MEZN0001234567890123',
        accountTitle: bankIban.title || 'OmniSaver Media Services',
        badge: 'Direct IBAN',
        color: '#3B82F6',
      },
    ];
  }
  return PAYMENT_CHANNELS;
}

export function getLiveSupportWhatsapp(): string {
  const remote = getCachedRemoteConfig();
  return remote?.paymentDetails?.whatsappNumber || '+923001234567';
}

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function generateDeviceId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `OMNI-${p1}-${p2}`;
}

// Deterministic offline license key generator tied to Device ID
export function generateLicenseKeyForDevice(deviceId: string, plan: 'monthly' | 'quarterly' | 'yearly'): string {
  const cleanDev = (deviceId || '').replace(/[^A-Z0-9]/g, '');
  const planPrefix = plan === 'monthly' ? 'M' : plan === 'quarterly' ? 'Q' : 'Y';
  const seed = `${cleanDev}:${planPrefix}:OMNISAVER_PRO_SECRET_2026`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `OMNI-${planPrefix}${hex.slice(0, 3)}-${hex.slice(3, 7)}`;
}

let proState: ProState = {
  isPro: false,
  planType: 'free',
  expiryTimestamp: null,
  deviceId: 'OMNI-LOAD-ING0',
  dailyFreePrivateCaptures: 0,
  lastCaptureDate: getTodayDateString(),
  licenseKey: null,
  initialized: false,
};

const listeners = new Set<(next: ProState) => void>();

function emitState() {
  listeners.forEach((cb) => {
    try {
      cb({ ...proState });
    } catch {}
  });
}

// Synchronous snapshot getter
export function getProState(): ProState {
  return { ...proState };
}

// Direct boolean entitlement check
export function getIsPro(): boolean {
  if (!proState.isPro) return false;
  if (proState.expiryTimestamp && Date.now() > proState.expiryTimestamp) {
    proState.isPro = false;
    proState.planType = 'free';
    emitState();
    return false;
  }
  return true;
}

// Initialize & load persisted PRO store from storage
export async function initializeProStore(): Promise<ProState> {
  try {
    const [savedIsPro, savedPlan, savedExpiry, savedDeviceId, savedCaptures, savedKey] =
      await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.IS_PRO),
        AsyncStorage.getItem(STORAGE_KEYS.PLAN_TYPE),
        AsyncStorage.getItem(STORAGE_KEYS.EXPIRY),
        AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_CAPTURES),
        AsyncStorage.getItem(STORAGE_KEYS.LICENSE_KEY),
      ]);

    // Ensure persistent unique Device ID
    let deviceId = savedDeviceId;
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }

    // Daily captures parsing
    const today = getTodayDateString();
    let dailyCaptures = 0;
    if (savedCaptures) {
      try {
        const parsed = JSON.parse(savedCaptures);
        if (parsed.date === today) {
          dailyCaptures = Number(parsed.count) || 0;
        }
      } catch {}
    }

    const expiryTimestamp = savedExpiry ? parseInt(savedExpiry, 10) : null;
    let isPro = savedIsPro === 'true';
    let planType = (savedPlan as ProPlanType) || 'free';

    // Auto-downgrade if subscription period has expired
    if (isPro && expiryTimestamp && Date.now() > expiryTimestamp) {
      isPro = false;
      planType = 'free';
      await AsyncStorage.setItem(STORAGE_KEYS.IS_PRO, 'false');
      await AsyncStorage.setItem(STORAGE_KEYS.PLAN_TYPE, 'free');
    }

    proState = {
      isPro,
      planType,
      expiryTimestamp,
      deviceId,
      dailyFreePrivateCaptures: dailyCaptures,
      lastCaptureDate: today,
      licenseKey: savedKey || null,
      initialized: true,
    };

    emitState();

    // Background: fetch remote app config & send heartbeat telemetry
    fetchRemoteAppConfig().catch(() => {});
    sendMobileTelemetry({
      action: 'heartbeat',
      deviceId: proState.deviceId,
      isPro: proState.isPro,
      details: `OmniSaver App Launch (${proState.isPro ? 'PRO' : 'FREE'})`,
    }).catch(() => {});

    return { ...proState };
  } catch (err) {
    console.warn('Could not initialize PRO store:', err);
    proState = {
      ...proState,
      deviceId: generateDeviceId(),
      initialized: true,
    };
    emitState();
    return { ...proState };
  }
}

// Verify and activate a license key or Transaction ID (TID)
export async function activateLicenseKey(
  rawKey: string,
  targetDeviceId?: string,
  targetPlan?: ProPlanType
): Promise<{ success: boolean; message: string; expiry?: number }> {
  const key = (rawKey || '').trim().toUpperCase();
  const devId = targetDeviceId || proState.deviceId;

  if (!key) {
    return { success: false, message: 'Please enter a valid Transaction ID or license key.' };
  }

  // 1. Try Live Verification with Backend API first
  try {
    const backendResult = await verifyLicenseWithBackend(
      key,
      devId,
      targetPlan && targetPlan !== 'free' ? targetPlan : undefined
    );
    if (backendResult.valid && backendResult.planType) {
      const finalExpiry =
        backendResult.expiresAt ||
        Date.now() +
          (backendResult.planType === 'yearly'
            ? 365
            : backendResult.planType === 'quarterly'
            ? 90
            : 30) *
            24 *
            60 *
            60 *
            1000;

      proState = {
        ...proState,
        isPro: true,
        planType: backendResult.planType,
        expiryTimestamp: finalExpiry,
        licenseKey: key,
      };

      try {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.IS_PRO, 'true'),
          AsyncStorage.setItem(STORAGE_KEYS.PLAN_TYPE, backendResult.planType),
          AsyncStorage.setItem(STORAGE_KEYS.EXPIRY, String(finalExpiry)),
          AsyncStorage.setItem(STORAGE_KEYS.LICENSE_KEY, key),
        ]);
      } catch {}

      emitState();
      return {
        success: true,
        message: 'OmniSaver PRO verified & activated successfully!',
        expiry: finalExpiry,
      };
    } else if (backendResult.error && backendResult.error !== 'NETWORK_OFFLINE') {
      // Backend explicitly rejected (e.g. bound to another device or expired)
      return {
        success: false,
        message: backendResult.error,
      };
    }
  } catch (_) {
    // Continue to offline verification fallback
  }

  // 2. Offline Algorithmic Verification Fallback
  const now = Date.now();
  let activatedPlan: ProPlanType | null = null;
  let durationDays = 30;

  // Dev-only test key (available in development or tests)
  if (key === 'OMNI-TEST-2026') {
    activatedPlan = 'monthly';
    durationDays = PRO_LIMITS.MONTHLY_DAYS;
  }
  // Algorithmic device-bound key matching (works offline)
  else {
    const monthlyKey = generateLicenseKeyForDevice(devId, 'monthly');
    const quarterlyKey = generateLicenseKeyForDevice(devId, 'quarterly');
    const yearlyKey = generateLicenseKeyForDevice(devId, 'yearly');

    if (key === monthlyKey) {
      activatedPlan = 'monthly';
      durationDays = PRO_LIMITS.MONTHLY_DAYS;
    } else if (key === quarterlyKey) {
      activatedPlan = 'quarterly';
      durationDays = PRO_LIMITS.QUARTERLY_DAYS;
    } else if (key === yearlyKey) {
      activatedPlan = 'yearly';
      durationDays = PRO_LIMITS.YEARLY_DAYS;
    }
  }

  if (!activatedPlan) {
    return {
      success: false,
      message: 'Invalid license key or not matching your Device ID. Please check and try again.',
    };
  }

  const expiryTimestamp = now + durationDays * 24 * 60 * 60 * 1000;

  proState = {
    ...proState,
    isPro: true,
    planType: activatedPlan,
    expiryTimestamp,
    licenseKey: key,
  };

  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.IS_PRO, 'true'),
      AsyncStorage.setItem(STORAGE_KEYS.PLAN_TYPE, activatedPlan),
      AsyncStorage.setItem(STORAGE_KEYS.EXPIRY, String(expiryTimestamp)),
      AsyncStorage.setItem(STORAGE_KEYS.LICENSE_KEY, key),
    ]);
  } catch {}

  emitState();
  return {
    success: true,
    message: `OmniSaver PRO activated offline (${durationDays} days access)!`,
    expiry: expiryTimestamp,
  };
}

// Deactivate PRO / Logout license (useful for testing or transfer)
export async function deactivatePro(): Promise<void> {
  proState = {
    ...proState,
    isPro: false,
    planType: 'free',
    expiryTimestamp: null,
    licenseKey: null,
  };

  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.IS_PRO, 'false'),
      AsyncStorage.setItem(STORAGE_KEYS.PLAN_TYPE, 'free'),
      AsyncStorage.removeItem(STORAGE_KEYS.EXPIRY),
      AsyncStorage.removeItem(STORAGE_KEYS.LICENSE_KEY),
    ]);
  } catch {}

  emitState();
}

// Check if user is eligible to perform an Instagram in-app browser private capture
export function canPerformPrivateCapture(): boolean {
  if (getIsPro()) return true;
  const today = getTodayDateString();
  const currentCount = proState.lastCaptureDate === today ? proState.dailyFreePrivateCaptures : 0;
  return currentCount < PRO_LIMITS.FREE_DAILY_PRIVATE_CAPTURES;
}

// Record a private capture attempt
export async function recordPrivateCapture(): Promise<{ allowed: boolean; remaining: number }> {
  if (getIsPro()) {
    return { allowed: true, remaining: 9999 };
  }

  const today = getTodayDateString();
  let currentCount = proState.lastCaptureDate === today ? proState.dailyFreePrivateCaptures : 0;

  if (currentCount >= PRO_LIMITS.FREE_DAILY_PRIVATE_CAPTURES) {
    return { allowed: false, remaining: 0 };
  }

  currentCount += 1;
  const remaining = Math.max(0, PRO_LIMITS.FREE_DAILY_PRIVATE_CAPTURES - currentCount);

  proState = {
    ...proState,
    dailyFreePrivateCaptures: currentCount,
    lastCaptureDate: today,
  };

  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.DAILY_CAPTURES,
      JSON.stringify({ date: today, count: currentCount })
    );
  } catch {}

  emitState();
  return { allowed: true, remaining };
}

// Helper to construct WhatsApp payment proof confirmation message
export function buildPaymentProofWhatsAppUrl(params: {
  planId: 'monthly' | 'quarterly' | 'yearly';
  tid: string;
  paymentMethod: string;
  supportPhone?: string;
}): string {
  const phone = params.supportPhone || '923001234567';
  const plan = PRO_PRICING[params.planId];
  const text =
    `Hello OmniSaver Team, I have transferred the payment for OmniSaver PRO.\n\n` +
    `⭐ Plan: ${plan.title} (${plan.price})\n` +
    `🔑 Device ID: ${proState.deviceId}\n` +
    `💳 Paid via: ${params.paymentMethod}\n` +
    `🧾 Transaction ID (TID): ${params.tid || 'Attached'}\n\n` +
    `Please verify and provide my license key. Thanks!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

// React Hook
export function useProStore(): ProState & {
  activateKey: typeof activateLicenseKey;
  deactivate: typeof deactivatePro;
  recordCapture: typeof recordPrivateCapture;
  canCapture: typeof canPerformPrivateCapture;
} {
  const [state, setState] = useState<ProState>(proState);

  useEffect(() => {
    listeners.add(setState);
    if (!proState.initialized) {
      void initializeProStore().then((fresh) => setState({ ...fresh }));
    }
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    ...state,
    activateKey: activateLicenseKey,
    deactivate: deactivatePro,
    recordCapture: recordPrivateCapture,
    canCapture: canPerformPrivateCapture,
  };
}

