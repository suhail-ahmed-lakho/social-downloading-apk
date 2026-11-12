import { useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined';
export type NotificationCategory = 'download' | 'system' | 'announcement';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  createdAt: number;
  read: boolean;
  ctaUrl?: string;
}

export interface NotificationState {
  permissionStatus: NotificationPermissionState;
  canAskAgain: boolean;
  expoPushToken: string | null;
  projectId: string | null;
  items: NotificationItem[];
  unreadCount: number;
  initialized: boolean;
}

const STORAGE_INBOX_KEY = '@omnisaver_notifications_inbox_v1';
const STORAGE_TOKEN_KEY = '@omnisaver_expo_push_token_v1';
const REMOTE_NOTICES_URL = 'https://looknow.cyou/api/notifications';
const FALLBACK_PROJECT_ID = 'f749bbeb-ae24-42a4-82f3-309ff57a8f69';

export const CHANNELS = {
  DOWNLOADS_PROGRESS: 'downloads-progress',
  DOWNLOADS_COMPLETE: 'downloads-complete',
  ANNOUNCEMENTS: 'announcements',
} as const;

let isHandlerConfigured = false;
let isInitializedStarted = false;
let subscriptionCleanup: (() => void) | null = null;

function resolveProjectId(): string | null {
  try {
    const fromExpo = Constants?.expoConfig?.extra?.eas?.projectId;
    const fromEas = Constants?.easConfig?.projectId;
    return (typeof fromExpo === 'string' && fromExpo) || (typeof fromEas === 'string' && fromEas) || FALLBACK_PROJECT_ID;
  } catch {
    return FALLBACK_PROJECT_ID;
  }
}

let state: NotificationState = {
  permissionStatus: 'undetermined',
  canAskAgain: true,
  expoPushToken: null,
  projectId: resolveProjectId(),
  items: [],
  unreadCount: 0,
  initialized: false,
};

const listeners = new Set<(next: NotificationState) => void>();

function emitState() {
  const unreadCount = state.items.filter((i) => !i.read).length;
  state = { ...state, unreadCount };
  listeners.forEach((cb) => {
    try {
      cb(state);
    } catch {}
  });
}

async function persistInbox(items: NotificationItem[]) {
  try {
    await AsyncStorage.setItem(STORAGE_INBOX_KEY, JSON.stringify(items.slice(0, 60)));
  } catch {}
}

export function addInAppNotification(
  entry: Omit<NotificationItem, 'id' | 'createdAt' | 'read'> & { id?: string; createdAt?: number }
): NotificationItem {
  const item: NotificationItem = {
    id: entry.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: entry.title,
    body: entry.body,
    category: entry.category,
    createdAt: entry.createdAt ?? Date.now(),
    read: false,
    ctaUrl: entry.ctaUrl,
  };

  // Deduplicate by exact ID so remote notices don't repeat
  const withoutDup = state.items.filter((existing) => existing.id !== item.id);
  const nextItems = [item, ...withoutDup].slice(0, 60);
  state = { ...state, items: nextItems };
  emitState();
  void persistInbox(nextItems);
  return item;
}

function configureForegroundHandler() {
  if (isHandlerConfigured || Platform.OS === 'web') return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    isHandlerConfigured = true;
  } catch (err) {
    console.warn('Could not configure notification handler:', err);
  }
}

async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNELS.DOWNLOADS_PROGRESS, {
      name: 'Active Downloads',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0],
      enableVibrate: false,
      showBadge: false,
      description: 'Live background download progress status',
    });

    await Notifications.setNotificationChannelAsync(CHANNELS.DOWNLOADS_COMPLETE, {
      name: 'Download Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#FF5E3A',
      showBadge: true,
      description: 'Alerts when your videos or MP3s finish downloading',
    });

    await Notifications.setNotificationChannelAsync(CHANNELS.ANNOUNCEMENTS, {
      name: 'App Updates & Broadcasts',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#FF5E3A',
      showBadge: true,
      description: 'Important OmniSaver feature news and extractor updates',
    });
  } catch (err) {
    console.warn('Could not setup Android notification channels:', err);
  }
}

async function refreshPushTokenIfGranted(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (state.permissionStatus !== 'granted') return null;

  try {
    const projectId = resolveProjectId();
    if (!projectId) return null;

    // Expo Go on SDK 53+ may not support remote push token; fail safely
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse?.data || null;
    if (token) {
      state = { ...state, expoPushToken: token, projectId };
      emitState();
      await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token);
    }
    return token;
  } catch {
    // Graceful fallback when running in Expo Go or without google-services.json
    return state.expoPushToken;
  }
}

async function readPermissionState(): Promise<{ status: NotificationPermissionState; canAskAgain: boolean }> {
  if (Platform.OS === 'web') {
    const webPerm = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    if (webPerm === 'granted') return { status: 'granted', canAskAgain: false };
    if (webPerm === 'denied') return { status: 'denied', canAskAgain: false };
    return { status: 'undetermined', canAskAgain: true };
  }

  try {
    const perms = await Notifications.getPermissionsAsync();
    const mapped: NotificationPermissionState =
      perms.status === 'granted' ? 'granted' : perms.status === 'denied' ? 'denied' : 'undetermined';
    return { status: mapped, canAskAgain: perms.canAskAgain ?? mapped !== 'denied' };
  } catch {
    return { status: 'undetermined', canAskAgain: true };
  }
}

export async function checkRemoteAnnouncements(): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(REMOTE_NOTICES_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return;

    const payload = await res.json();
    const list = Array.isArray(payload) ? payload : Array.isArray(payload?.notifications) ? payload.notifications : [];
    for (const entry of list.slice(0, 10)) {
      if (!entry || !entry.title || !entry.body) continue;
      const existing = state.items.find((i) => i.id === String(entry.id || entry.title));
      if (!existing) {
        addInAppNotification({
          id: String(entry.id || entry.title),
          title: String(entry.title),
          body: String(entry.body),
          category: 'announcement',
          createdAt: entry.createdAt ? Number(new Date(entry.createdAt)) || Date.now() : Date.now(),
          ctaUrl: typeof entry.ctaUrl === 'string' ? entry.ctaUrl : undefined,
        });
      }
    }
  } catch {
    // Remote notification feed is optional; ignore offline/404 gracefully
  }
}

export async function initializeNotifications(): Promise<NotificationState> {
  if (isInitializedStarted) return state;
  isInitializedStarted = true;

  configureForegroundHandler();
  await setupAndroidChannels();

  try {
    const rawInbox = await AsyncStorage.getItem(STORAGE_INBOX_KEY);
    if (rawInbox) {
      const parsed = JSON.parse(rawInbox);
      if (Array.isArray(parsed)) {
        state = { ...state, items: parsed };
      }
    }
  } catch {}

  try {
    const savedToken = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
    if (savedToken) {
      state = { ...state, expoPushToken: savedToken };
    }
  } catch {}

  const perm = await readPermissionState();
  state = {
    ...state,
    permissionStatus: perm.status,
    canAskAgain: perm.canAskAgain,
    initialized: true,
    projectId: resolveProjectId(),
  };

  if (state.items.length === 0) {
    addInAppNotification({
      id: 'welcome-bg-downloads',
      title: 'Background Downloads Enabled',
      body: 'Downloads now continue even when you switch apps, with live MB/s speed and remaining MB tracking.',
      category: 'system',
    });
  } else {
    emitState();
  }

  if (perm.status === 'granted') {
    void refreshPushTokenIfGranted();
  }

  if (Platform.OS !== 'web' && !subscriptionCleanup) {
    try {
      const receiveSub = Notifications.addNotificationReceivedListener((notification) => {
        const content = notification?.request?.content;
        if (content?.title || content?.body) {
          addInAppNotification({
            id: notification.request.identifier || undefined,
            title: content.title || 'OmniSaver Alert',
            body: content.body || '',
            category:
              content.data?.category === 'download'
                ? 'download'
                : content.data?.category === 'announcement'
                  ? 'announcement'
                  : 'system',
            ctaUrl: typeof content.data?.ctaUrl === 'string' ? content.data.ctaUrl : undefined,
          });
        }
      });

      const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const id = response?.notification?.request?.identifier;
        if (id) markNotificationRead(id);
      });

      subscriptionCleanup = () => {
        receiveSub.remove();
        responseSub.remove();
      };
    } catch {}
  }

  void checkRemoteAnnouncements();
  return state;
}

export async function refreshNotificationPermission(): Promise<NotificationPermissionState> {
  const perm = await readPermissionState();
  state = {
    ...state,
    permissionStatus: perm.status,
    canAskAgain: perm.canAskAgain,
  };
  emitState();
  if (perm.status === 'granted') {
    await refreshPushTokenIfGranted();
  }
  return perm.status;
}

export async function requestNotificationPermissions(): Promise<NotificationPermissionState> {
  configureForegroundHandler();
  await setupAndroidChannels();

  if (Platform.OS === 'web') {
    if (typeof Notification !== 'undefined' && typeof Notification.requestPermission === 'function') {
      try {
        const result = await Notification.requestPermission();
        const mapped: NotificationPermissionState =
          result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'undetermined';
        state = { ...state, permissionStatus: mapped, canAskAgain: mapped === 'undetermined' };
        emitState();
        return mapped;
      } catch {
        return state.permissionStatus;
      }
    }
    return state.permissionStatus;
  }

  try {
    const res = await Notifications.requestPermissionsAsync();
    const mapped: NotificationPermissionState =
      res.status === 'granted' ? 'granted' : res.status === 'denied' ? 'denied' : 'undetermined';
    state = {
      ...state,
      permissionStatus: mapped,
      canAskAgain: res.canAskAgain ?? mapped !== 'denied',
    };
    emitState();
    if (mapped === 'granted') {
      await refreshPushTokenIfGranted();
    }
    return mapped;
  } catch {
    return state.permissionStatus;
  }
}

export async function openNotificationSettings(): Promise<void> {
  if (Platform.OS === 'web') {
    addInAppNotification({
      title: 'Browser Notification Permission',
      body: 'Click the lock/settings icon in your browser address bar to allow OmniSaver notifications.',
      category: 'system',
    });
    return;
  }
  try {
    await Linking.openSettings();
  } catch {}
}

export async function dispatchLocalNotification(params: {
  title: string;
  body: string;
  category: NotificationCategory;
  channelId?: string;
  data?: Record<string, unknown>;
  alsoAddToInbox?: boolean;
}): Promise<void> {
  const {
    title,
    body,
    category,
    channelId = CHANNELS.DOWNLOADS_COMPLETE,
    data,
    alsoAddToInbox = true,
  } = params;

  if (alsoAddToInbox) {
    addInAppNotification({
      title,
      body,
      category,
      ctaUrl: typeof data?.ctaUrl === 'string' ? data.ctaUrl : undefined,
    });
  }

  if (state.permissionStatus !== 'granted') return;

  if (Platform.OS === 'web') {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    } catch {}
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { category, ...(data || {}) },
        sound: true,
        ...(Platform.OS === 'android' ? { channelId } : {}),
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('Failed to schedule local notification:', err);
  }
}

export async function notifyDownloadComplete(title: string, isAudio: boolean, sizeMB?: string): Promise<void> {
  const mediaLabel = isAudio ? 'MP3 Audio' : 'HD Video';
  const sizeNote = sizeMB ? ` (${sizeMB})` : '';
  await dispatchLocalNotification({
    title: `${mediaLabel} Saved!`,
    body: `${title}${sizeNote} finished downloading and is ready in Saved Files.`,
    category: 'download',
    channelId: CHANNELS.DOWNLOADS_COMPLETE,
  });
}

export async function notifyDownloadFailed(title: string, reason: string): Promise<void> {
  await dispatchLocalNotification({
    title: 'Download Interrupted',
    body: `${title}: ${reason}`,
    category: 'download',
    channelId: CHANNELS.DOWNLOADS_COMPLETE,
  });
}

export async function sendTestNotification(): Promise<void> {
  await dispatchLocalNotification({
    title: 'OmniSaver Alerts Active',
    body: 'You will receive alerts when background downloads finish or new platform updates arrive.',
    category: 'announcement',
    channelId: CHANNELS.ANNOUNCEMENTS,
  });
}

export function markNotificationRead(id: string): void {
  const nextItems = state.items.map((item) => (item.id === id ? { ...item, read: true } : item));
  state = { ...state, items: nextItems };
  emitState();
  void persistInbox(nextItems);
}

export function markAllNotificationsRead(): void {
  const nextItems = state.items.map((item) => ({ ...item, read: true }));
  state = { ...state, items: nextItems };
  emitState();
  void persistInbox(nextItems);
}

export function clearNotifications(): void {
  state = { ...state, items: [] };
  emitState();
  void persistInbox([]);
}

export function getNotificationSnapshot(): NotificationState {
  return state;
}

export function useNotifications(): NotificationState {
  const [snapshot, setSnapshot] = useState<NotificationState>(state);

  useEffect(() => {
    listeners.add(setSnapshot);
    void initializeNotifications().then((next) => setSnapshot({ ...next }));
    return () => {
      listeners.delete(setSnapshot);
    };
  }, []);

  return snapshot;
}

