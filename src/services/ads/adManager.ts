import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_AD_DOWNLOADS_COUNT_KEY = '@omnisaver_ad_downloads_count_v1';
const INTERSTITIAL_DOWNLOAD_INTERVAL = 3; // Trigger ad check every 3 completed downloads
const INTERSTITIAL_MIN_COOLDOWN_MS = 45 * 1000; // 45 seconds between interstitials

interface AdManagerState {
  totalDownloadsCompleted: number;
  lastInterstitialShownAt: number;
  isAdSdkInitialized: boolean;
}

let adState: AdManagerState = {
  totalDownloadsCompleted: 0,
  lastInterstitialShownAt: 0,
  isAdSdkInitialized: false,
};

const listeners = new Set<(next: AdManagerState) => void>();

function emitState() {
  listeners.forEach((cb) => {
    try {
      cb({ ...adState });
    } catch {}
  });
}

// Initialize ad manager and restore counter
export async function initializeAdManager(): Promise<void> {
  try {
    const rawCount = await AsyncStorage.getItem(STORAGE_AD_DOWNLOADS_COUNT_KEY);
    if (rawCount) {
      adState.totalDownloadsCompleted = parseInt(rawCount, 10) || 0;
    }
    // Flag SDK as ready for slots/interstitials
    adState.isAdSdkInitialized = true;
    emitState();
  } catch {
    adState.isAdSdkInitialized = true;
    emitState();
  }
}

// Call whenever a download completes successfully
export async function recordDownloadCompletedForAds(): Promise<{
  shouldShowInterstitial: boolean;
  downloadCount: number;
}> {
  adState.totalDownloadsCompleted += 1;
  const count = adState.totalDownloadsCompleted;

  try {
    await AsyncStorage.setItem(STORAGE_AD_DOWNLOADS_COUNT_KEY, String(count));
  } catch {}

  const now = Date.now();
  const timeSinceLastAd = now - adState.lastInterstitialShownAt;

  // Interstitial triggered after every 2nd or 3rd completed download, respecting cooldown
  const isIntervalReached = count > 0 && count % INTERSTITIAL_DOWNLOAD_INTERVAL === 0;
  const isCooldownSatisfied = timeSinceLastAd >= INTERSTITIAL_MIN_COOLDOWN_MS;
  const shouldShowInterstitial = isIntervalReached && isCooldownSatisfied;

  if (shouldShowInterstitial) {
    adState.lastInterstitialShownAt = now;
  }

  emitState();
  return { shouldShowInterstitial, downloadCount: count };
}

// Hook to trigger an interstitial ad display when ready
export async function showInterstitialIfReady(): Promise<boolean> {
  const now = Date.now();
  if (now - adState.lastInterstitialShownAt < INTERSTITIAL_MIN_COOLDOWN_MS) {
    return false;
  }
  adState.lastInterstitialShownAt = now;
  emitState();
  // Placeholder hook ready to plug into AdMob / AppLovin / UnityAds interstitial
  return true;
}

// Rewarded ad unlock hook for premium features (e.g. batch download or 4K streams)
export async function requestRewardedUnlock(feature: '4k_download' | 'batch_download'): Promise<boolean> {
  // Plug in RewardedAd.show() here. Defaults to granted in development.
  return true;
}

// Centralized React hook
export function useAdManager(): AdManagerState & {
  recordDownload: typeof recordDownloadCompletedForAds;
  showInterstitial: typeof showInterstitialIfReady;
  requestRewarded: typeof requestRewardedUnlock;
} {
  const [state, setState] = useState<AdManagerState>(adState);

  useEffect(() => {
    listeners.add(setState);
    void initializeAdManager().then(() => setState({ ...adState }));
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    ...state,
    recordDownload: recordDownloadCompletedForAds,
    showInterstitial: showInterstitialIfReady,
    requestRewarded: requestRewardedUnlock,
  };
}

