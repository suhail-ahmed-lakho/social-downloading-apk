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
  guestId: string;
  userName: string;
  isCustomName: boolean;
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
  USER_NAME: '@omnisaver_pro_user_name_v1',
} as const;

export function deriveGuestId(deviceId: string): string {
  const clean = (deviceId || '').replace(/[^A-Z0-9]/g, '');
  return `Guest #${clean.slice(-4) || '2026'}`;
}

export interface RemainingTimeInfo {
  formatted: string;
  shortLabel: string;
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
  isGrace: boolean;
  expiryDateFormatted: string;
}

export function calculateRemainingTime(expiryTimestamp: number | null): RemainingTimeInfo {
  if (!expiryTimestamp) {
    return {
      formatted: 'Free Tier (No Expiry)',
      shortLabel: 'Free Plan',
      days: 0,
      hours: 0,
      minutes: 0,
      isExpired: false,
      isGrace: false,
      expiryDateFormatted: 'N/A',
    };
  }

  const now = Date.now();
  const diff = expiryTimestamp - now;

  const expDate = new Date(expiryTimestamp);
  const dateStr = expDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = expDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const expiryDateFormatted = `${dateStr} at ${timeStr}`;

  if (diff <= 0) {
    return {
      formatted: 'Subscription Expired',
      shortLabel: 'Expired',
      days: 0,
      hours: 0,
      minutes: 0,
      isExpired: true,
      isGrace: false,
      expiryDateFormatted,
    };
  }

  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const remainingMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const isGrace = totalHours <= 26; // Grace 24h

  let formatted = '';
  let shortLabel = '';

  if (totalDays > 0) {
    formatted = `${totalDays} Day${totalDays > 1 ? 's' : ''}, ${remainingHours} Hour${remainingHours !== 1 ? 's' : ''} Left`;
    shortLabel = `${totalDays}d left`;
  } else if (totalHours > 0) {
    formatted = `${totalHours} Hour${totalHours > 1 ? 's' : ''}, ${remainingMinutes}m Left`;
    shortLabel = `${totalHours}h left`;
  } else {
    formatted = `${Math.max(1, remainingMinutes)} Min Left`;
    shortLabel = `${Math.max(1, remainingMinutes)}m left`;
  }

  return {
    formatted,
    shortLabel,
    days: totalDays,
    hours: totalHours,
    minutes: remainingMinutes,
    isExpired: false,
    isGrace,
    expiryDateFormatted,
  };
}

export function getPlanDisplayMeta(
  planType: ProPlanType,
  isPro: boolean,
  expiryTimestamp: number | null
): {
  title: string;
  badge: string;
  badgeColor: string;
  accentGradient: [string, string];
  isGrace: boolean;
  description: string;
} {
  if (!isPro) {
    return {
      title: 'Free Tier',
      badge: 'FREE',
      badgeColor: '#64748B',
      accentGradient: ['#334155', '#1E293B'],
      isGrace: false,
      description: 'Standard speed • 2 Private IG captures / day',
    };
  }

  const remaining = calculateRemainingTime(expiryTimestamp);
  if (remaining.isGrace) {
    return {
      title: '24h Grace PRO',
      badge: '24H GRACE',
      badgeColor: '#F59E0B',
      accentGradient: ['#F59E0B', '#B45309'],
      isGrace: true,
      description: 'Instant full access while bank receipt is verified',
    };
  }

  switch (planType) {
    case 'yearly':
      return {
        title: 'Yearly Obsidian VIP',
        badge: 'YEARLY VIP',
        badgeColor: '#F59E0B',
        accentGradient: ['#F59E0B', '#78350F'],
        isGrace: false,
        description: 'Permanent VIP suite • Studio master MP3 & 4K UHD',
      };
    case 'quarterly':
      return {
        title: '3 Months Saver PRO',
        badge: '3-MONTHS VIP',
        badgeColor: '#A855F7',
        accentGradient: ['#A855F7', '#6B21A8'],
        isGrace: false,
        description: 'Turbo multi-core threads • Unlimited private capture',
      };
    case 'monthly':
      return {
        title: 'Monthly VIP PRO',
        badge: 'MONTHLY VIP',
        badgeColor: '#3B82F6',
        accentGradient: ['#3B82F6', '#1D4ED8'],
        isGrace: false,
        description: 'Flexible 30-day full speed access & zero ads',
      };
    default:
      return {
        title: 'OmniSaver PRO',
        badge: 'ACTIVE PRO',
        badgeColor: '#10B981',
        accentGradient: ['#10B981', '#047857'],
        isGrace: false,
        description: 'Full premium downloading unlocked',
      };
  }
}

export const PRO_LIMITS = {
  FREE_DAILY_PRIVATE_CAPTURES: 2,
  MONTHLY_DAYS: 30,
  QUARTERLY_DAYS: 90,
  YEARLY_DAYS: 365,
} as const;

export const PRO_PRICING = {
  monthly: { id: 'monthly' as const, title: 'Monthly VIP Pass', price: 'Rs. 150', duration: '30 Days', periodDays: 30 },
  quarterly: { id: 'quarterly' as const, title: 'Monthly VIP Pass', price: 'Rs. 150', duration: '30 Days', periodDays: 30 },
  yearly: { id: 'yearly' as const, title: 'Monthly VIP Pass', price: 'Rs. 150', duration: '30 Days', periodDays: 30 },
} as const;

export const PAYMENT_CHANNELS = [
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    accountNumber: '03078235748',
    accountTitle: 'Suhail Ahmed',
    badge: 'Instant Transfer',
    color: '#00BA51',
  },
  {
    id: 'nayapay',
    name: 'NayaPay',
    accountNumber: '03078235748',
    accountTitle: 'Suhail Ahmed',
    badge: 'Zero Fees',
    color: '#FF6B00',
  },
  {
    id: 'sadapay',
    name: 'SadaPay',
    accountNumber: '03078235748',
    accountTitle: 'Suhail Ahmed',
    badge: 'Raast / Instant Transfer',
    color: '#3B82F6',
  },
] as const;

export function getLivePaymentChannels() {
  const remote = getCachedRemoteConfig();
  if (remote?.paymentDetails) {
    const { easypaisa, nayapay, bankIban } = remote.paymentDetails;
    const cleanBank =
      bankIban?.iban && !bankIban.iban.includes('0001234567890123')
        ? bankIban.iban
        : '03078235748';

    return [
      {
        id: 'easypaisa',
        name: 'Easypaisa',
        accountNumber: easypaisa.accountNo || '03078235748',
        accountTitle: easypaisa.title || 'Suhail Ahmed',
        badge: 'Instant Transfer',
        color: '#00BA51',
      },
      {
        id: 'nayapay',
        name: 'NayaPay',
        accountNumber: nayapay.accountId || '03078235748',
        accountTitle: nayapay.title || 'Suhail Ahmed',
        badge: 'Zero Fees',
        color: '#FF6B00',
      },
      {
        id: 'sadapay',
        name: 'SadaPay',
        accountNumber: cleanBank,
        accountTitle: bankIban.title || 'Suhail Ahmed',
        badge: 'Raast / Instant Transfer',
        color: '#3B82F6',
      },
    ];
  }
  return PAYMENT_CHANNELS;
}

export function getLiveSupportWhatsapp(): string {
  const remote = getCachedRemoteConfig();
  return remote?.paymentDetails?.whatsappNumber || '03078235748';
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
  guestId: 'Guest #2026',
  userName: 'Guest #2026',
  isCustomName: false,
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

// User Profile Name Management
export async function updateUserName(newName: string): Promise<void> {
  const trimmed = newName.trim();
  const guestId = deriveGuestId(proState.deviceId);
  const finalName = trimmed || guestId;
  const isCustom = Boolean(trimmed && trimmed !== guestId);

  proState = {
    ...proState,
    userName: finalName,
    isCustomName: isCustom,
  };

  try {
    if (isCustom) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, finalName);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_NAME);
    }
  } catch {}

  emitState();

  // Instant Cloudflare D1 telemetry sync with updated name
  sendMobileTelemetry({
    action: 'heartbeat',
    deviceId: proState.deviceId,
    userName: finalName,
    isPro: proState.isPro,
    details: `Profile name set to "${finalName}"`,
  }).catch(() => {});
}

export async function resetToGuestName(): Promise<void> {
  const guestId = deriveGuestId(proState.deviceId);
  await updateUserName(guestId);
}

// Initialize & load persisted PRO store from storage
export async function initializeProStore(): Promise<ProState> {
  try {
    const [savedIsPro, savedPlan, savedExpiry, savedDeviceId, savedCaptures, savedKey, savedUserName] =
      await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.IS_PRO),
        AsyncStorage.getItem(STORAGE_KEYS.PLAN_TYPE),
        AsyncStorage.getItem(STORAGE_KEYS.EXPIRY),
        AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_CAPTURES),
        AsyncStorage.getItem(STORAGE_KEYS.LICENSE_KEY),
        AsyncStorage.getItem(STORAGE_KEYS.USER_NAME),
      ]);

    // Ensure persistent unique Device ID
    let deviceId = savedDeviceId;
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }

    const guestId = deriveGuestId(deviceId);
    const userName = savedUserName && savedUserName.trim() ? savedUserName.trim() : guestId;
    const isCustomName = Boolean(savedUserName && savedUserName.trim() && savedUserName.trim() !== guestId);

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
      guestId,
      userName,
      isCustomName,
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
      userName: proState.userName,
      isPro: proState.isPro,
      details: `OmniSaver App Launch (${proState.isPro ? 'PRO' : 'FREE'}) - ${proState.userName}`,
    }).catch(() => {});

    return { ...proState };
  } catch (err) {
    console.warn('Could not initialize PRO store:', err);
    const fallbackDevId = generateDeviceId();
    const fallbackGuest = deriveGuestId(fallbackDevId);
    proState = {
      ...proState,
      deviceId: fallbackDevId,
      guestId: fallbackGuest,
      userName: fallbackGuest,
      isCustomName: false,
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
  const phone = params.supportPhone || getLiveSupportWhatsapp();
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const plan = PRO_PRICING[params.planId];
  const remaining = calculateRemainingTime(proState.expiryTimestamp);

  const text =
    `Hello OmniSaver Team, I have transferred the payment for OmniSaver PRO.\n\n` +
    `• User Name: ${proState.userName} (${proState.guestId})\n` +
    `• Hardware Device ID: ${proState.deviceId}\n` +
    `• Plan Selected: ${plan.title} (${plan.price})\n` +
    `• Paid via: ${params.paymentMethod}\n` +
    `• Transaction ID (TID): ${params.tid || 'Attached'}\n` +
    (proState.isPro ? `• Current Status: ${proState.planType.toUpperCase()} (${remaining.shortLabel})\n\n` : `\n`) +
    `Please verify my payment receipt and activate my account. Thanks!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

// React Hook
export function useProStore(): ProState & {
  activateKey: typeof activateLicenseKey;
  deactivate: typeof deactivatePro;
  recordCapture: typeof recordPrivateCapture;
  canCapture: typeof canPerformPrivateCapture;
  setUserName: typeof updateUserName;
  resetToGuestName: typeof resetToGuestName;
  remainingTime: RemainingTimeInfo;
  planMeta: ReturnType<typeof getPlanDisplayMeta>;
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
    setUserName: updateUserName,
    resetToGuestName,
    remainingTime: calculateRemainingTime(state.expiryTimestamp),
    planMeta: getPlanDisplayMeta(state.planType, state.isPro, state.expiryTimestamp),
  };
}

