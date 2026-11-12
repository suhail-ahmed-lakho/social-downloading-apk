import { useEffect, useState } from 'react';
import { AppState, NativeModules, Platform } from 'react-native';
import * as ReactNative from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { DownloadTask as BgDownloadTask } from '@kesha-antonov/react-native-background-downloader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DownloadHistoryItem, PlatformType } from '../../types';
import { addDownloadToHistory } from '../storage/history';
import { notifyDownloadComplete, notifyDownloadFailed } from '../notifications/notificationService';
import {
  buildDownloadHeaders,
  extractDirectUrlFromRapidCdn,
  isMetaCdnUrl,
  MIN_VALID_MEDIA_BYTES,
  requestGalleryPermissions,
  resolveDownloadTargetUrl,
  sanitizeMediaFilename,
  validateAndFinalizeNativeFile,
} from './downloadManager';
import {
  computeDownloadTelemetry,
  DownloadTelemetry,
  formatBytesToMB,
  recordSpeedSample,
  SpeedSample,
} from './downloadTelemetry';

export type QueueItemStatus =
  | 'queued'
  | 'resolving'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface EnqueueDownloadRequest {
  url: string;
  filename: string;
  title: string;
  author?: string;
  platform: PlatformType;
  thumbnail?: string;
  originalUrl: string;
  qualityLabel: string;
  isAudio?: boolean;
}

export interface DownloadQueueItem {
  id: string;
  title: string;
  author?: string;
  platform: PlatformType;
  thumbnail?: string;
  originalUrl: string;
  sourceUrl: string;
  resolvedUrl?: string;
  qualityLabel: string;
  isAudio: boolean;
  filename: string;
  destinationPath: string;
  status: QueueItemStatus;
  telemetry: DownloadTelemetry;
  localUri?: string;
  savedToGallery?: boolean;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DownloadQueueSnapshot {
  items: DownloadQueueItem[];
  activeCount: number;
  pausedCount: number;
  completedCount: number;
  totalSpeedBps: number;
  initialized: boolean;
  nativeBackgroundSupported: boolean;
}

const STORAGE_QUEUE_KEY = '@omnisaver_download_queue_v1';

const nativeTasks = new Map<string, BgDownloadTask>();
const resumableTasks = new Map<string, FileSystem.DownloadResumable>();
const webControllers = new Map<
  string,
  {
    abortController: AbortController;
    paused: boolean;
    resumeWaiters: Array<() => void>;
  }
>();
const speedSamplesMap = new Map<string, SpeedSample[]>();
const fallbackTriedSet = new Set<string>();

let queueItems: DownloadQueueItem[] = [];
let initialized = false;
let isBgConfigured = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

const queueListeners = new Set<(snapshot: DownloadQueueSnapshot) => void>();
const completedCallbacks = new Set<(historyItem: DownloadHistoryItem) => void>();

type BgDownloaderModule = typeof import('@kesha-antonov/react-native-background-downloader');

function getBgDownloader(): BgDownloaderModule | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@kesha-antonov/react-native-background-downloader') as BgDownloaderModule;
  } catch {
    return null;
  }
}

export function isNativeBackgroundDownloaderSupported(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    const turbo = (ReactNative as unknown as {
      TurboModuleRegistry?: { get?: (name: string) => unknown };
    })?.TurboModuleRegistry;
    const hasNative = Boolean(
      turbo?.get?.('RNBackgroundDownloader') || NativeModules?.RNBackgroundDownloader
    );
    return hasNative && Boolean(getBgDownloader());
  } catch {
    return false;
  }
}

function getEmptyTelemetry(statusText?: string): DownloadTelemetry {
  return computeDownloadTelemetry({
    writtenBytes: 0,
    totalBytes: 0,
    samples: [],
    statusText,
  });
}

function buildSnapshot(): DownloadQueueSnapshot {
  const activeStatuses: QueueItemStatus[] = ['queued', 'resolving', 'downloading'];
  const activeItems = queueItems.filter((i) => activeStatuses.includes(i.status));
  const pausedCount = queueItems.filter((i) => i.status === 'paused').length;
  const completedCount = queueItems.filter((i) => i.status === 'completed').length;
  const totalSpeedBps = activeItems.reduce(
    (sum, item) => sum + (item.status === 'downloading' ? item.telemetry.speedBps : 0),
    0
  );

  return {
    items: [...queueItems],
    activeCount: activeItems.length,
    pausedCount,
    completedCount,
    totalSpeedBps,
    initialized,
    nativeBackgroundSupported: isNativeBackgroundDownloaderSupported(),
  };
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void AsyncStorage.setItem(
      STORAGE_QUEUE_KEY,
      JSON.stringify(queueItems.slice(0, 40))
    ).catch(() => {});
  }, 400);
}

function persistImmediately() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  void AsyncStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queueItems.slice(0, 40))).catch(
    () => {}
  );
}

function emitQueueUpdate(immediatePersist = false) {
  const snapshot = buildSnapshot();
  queueListeners.forEach((cb) => {
    try {
      cb(snapshot);
    } catch {}
  });
  if (immediatePersist) {
    persistImmediately();
  } else {
    schedulePersist();
  }
}

function updateItem(id: string, updater: (prev: DownloadQueueItem) => DownloadQueueItem, immediatePersist = false) {
  const idx = queueItems.findIndex((item) => item.id === id);
  if (idx === -1) return;
  const next = [...queueItems];
  next[idx] = updater(next[idx]);
  queueItems = next;
  emitQueueUpdate(immediatePersist);
}

function ensureBgConfigured() {
  if (isBgConfigured || !isNativeBackgroundDownloaderSupported()) return;
  const bg = getBgDownloader();
  if (!bg) return;
  try {
    bg.setConfig({
      progressInterval: 250,
      progressMinBytes: 32768,
      maxParallelDownloads: 4,
      allowsCellularAccess: true,
      showNotificationsEnabled: true,
      showCompletionNotification: true,
      showCancelAction: true,
      notificationsGrouping: {
        enabled: true,
        mode: 'individual',
        texts: {
          downloadTitle: 'OmniSaver Download',
          downloadStarting: 'Preparing background transfer...',
          downloadProgress: 'Downloading... {progress}%',
          downloadPaused: 'Paused',
          downloadFinished: 'Saved to gallery',
          downloadCancel: 'Cancel',
          groupTitle: 'OmniSaver Downloads',
          groupText: '{count} downloads active',
        },
      },
    });
    isBgConfigured = true;
  } catch (err) {
    console.warn('Could not configure native background downloader:', err);
  }
}

async function recordSavedHistoryAndNotify(
  item: DownloadQueueItem,
  localUri: string,
  savedToGallery: boolean,
  fileSize: number
) {
  const historyItem: DownloadHistoryItem = {
    id: item.id,
    platform: item.platform,
    title: item.title,
    author: item.author || '',
    thumbnail: item.thumbnail || '',
    localUri,
    originalUrl: item.originalUrl,
    fileSize,
    createdAt: Date.now(),
  };

  await addDownloadToHistory(historyItem);
  completedCallbacks.forEach((cb) => {
    try {
      cb(historyItem);
    } catch {}
  });

  const sizeMB = fileSize > 0 ? formatBytesToMB(fileSize) : undefined;
  await notifyDownloadComplete(item.title, item.isAudio, sizeMB);

  const finalBytes = Math.max(fileSize, item.telemetry.totalBytes, item.telemetry.downloadedBytes);
  updateItem(
    item.id,
    (prev) => ({
      ...prev,
      status: 'completed',
      localUri,
      savedToGallery,
      updatedAt: Date.now(),
      telemetry: {
        ...prev.telemetry,
        percent: 100,
        downloadedBytes: finalBytes,
        totalBytes: finalBytes,
        remainingBytes: 0,
        downloadedMB: formatBytesToMB(finalBytes),
        totalMB: finalBytes > 0 ? formatBytesToMB(finalBytes) : prev.telemetry.totalMB,
        remainingMB: '0.00 MB',
        speedBps: 0,
        speedText: '0 KB/s',
        etaSeconds: 0,
        etaText: 'Done',
        statusText: savedToGallery ? 'Saved to Gallery' : 'Download Complete',
      },
    }),
    true
  );
}

async function failQueueItem(id: string, title: string, reason: string) {
  nativeTasks.delete(id);
  resumableTasks.delete(id);
  webControllers.delete(id);
  speedSamplesMap.delete(id);

  updateItem(
    id,
    (prev) => ({
      ...prev,
      status: 'failed',
      errorMessage: reason,
      updatedAt: Date.now(),
      telemetry: {
        ...prev.telemetry,
        speedBps: 0,
        speedText: '0 KB/s',
        etaText: '--',
        statusText: reason,
      },
    }),
    true
  );
  await notifyDownloadFailed(title, reason);
}

async function attemptFallbackRetryIfApplicable(
  item: DownloadQueueItem,
  currentUrl: string
): Promise<boolean> {
  const retryKey = `${item.id}:${currentUrl}`;
  if (fallbackTriedSet.has(retryKey)) return false;

  if (currentUrl.includes('rapidcdn.app')) {
    const directMetaUrl = extractDirectUrlFromRapidCdn(currentUrl);
    if (directMetaUrl && directMetaUrl.startsWith('http')) {
      fallbackTriedSet.add(retryKey);
      fallbackTriedSet.add(`${item.id}:${directMetaUrl}`);
      await launchNativeBackgroundTask(
        item,
        directMetaUrl,
        buildDownloadHeaders(directMetaUrl, 'bot-direct')
      );
      return true;
    }
  }

  if (isMetaCdnUrl(currentUrl)) {
    fallbackTriedSet.add(retryKey);
    await launchNativeBackgroundTask(
      item,
      currentUrl,
      buildDownloadHeaders(currentUrl, 'no-referer')
    );
    return true;
  }

  return false;
}

function attachNativeTaskHandlers(task: BgDownloadTask, initialItem: DownloadQueueItem) {
  nativeTasks.set(task.id, task);

  task
    .begin(({ expectedBytes }) => {
      const now = Date.now();
      const samples = recordSpeedSample(speedSamplesMap.get(task.id) || [], 0, now);
      speedSamplesMap.set(task.id, samples);

      updateItem(task.id, (prev) => ({
        ...prev,
        status: 'downloading',
        updatedAt: now,
        telemetry: computeDownloadTelemetry({
          writtenBytes: 0,
          totalBytes: expectedBytes > 0 ? expectedBytes : prev.telemetry.totalBytes,
          samples,
          statusText: prev.isAudio ? 'Downloading MP3 audio...' : 'Downloading in background...',
        }),
      }));
    })
    .progress(({ bytesDownloaded, bytesTotal }) => {
      const now = Date.now();
      const samples = recordSpeedSample(speedSamplesMap.get(task.id) || [], bytesDownloaded, now);
      speedSamplesMap.set(task.id, samples);

      updateItem(task.id, (prev) => ({
        ...prev,
        status: 'downloading',
        updatedAt: now,
        telemetry: computeDownloadTelemetry({
          writtenBytes: bytesDownloaded,
          totalBytes: bytesTotal > 0 ? bytesTotal : prev.telemetry.totalBytes,
          samples,
          statusText: prev.isAudio ? 'Saving MP3 audio...' : 'Downloading HD video...',
        }),
      }));
    })
    .done(async ({ location, bytesDownloaded }) => {
      const currentItem = queueItems.find((i) => i.id === task.id) || initialItem;
      nativeTasks.delete(task.id);
      speedSamplesMap.delete(task.id);

      try {
        getBgDownloader()?.completeHandler(task.id);
      } catch {}

      try {
        const uri = location.startsWith('file://') ? location : `file://${location}`;
        const finalized = await validateAndFinalizeNativeFile(uri, currentItem.isAudio);
        await recordSavedHistoryAndNotify(
          currentItem,
          finalized.localUri,
          finalized.savedToGallery,
          finalized.fileSize || bytesDownloaded
        );
      } catch (err: unknown) {
        const retried = await attemptFallbackRetryIfApplicable(
          currentItem,
          currentItem.resolvedUrl || currentItem.sourceUrl
        );
        if (!retried) {
          const message =
            err instanceof Error ? err.message : 'Downloaded file could not be verified.';
          await failQueueItem(task.id, currentItem.title, message);
        }
      }
    })
    .error(async ({ error, errorCode }) => {
      const currentItem = queueItems.find((i) => i.id === task.id) || initialItem;
      nativeTasks.delete(task.id);
      speedSamplesMap.delete(task.id);

      // errorCode -1 indicates manual cancellation from notification or stop()
      if (errorCode === -1 || currentItem.status === 'cancelled') {
        updateItem(
          task.id,
          (prev) => ({
            ...prev,
            status: 'cancelled',
            updatedAt: Date.now(),
            telemetry: {
              ...prev.telemetry,
              speedBps: 0,
              speedText: '0 KB/s',
              etaText: '--',
              statusText: 'Cancelled',
            },
          }),
          true
        );
        return;
      }

      const retried = await attemptFallbackRetryIfApplicable(
        currentItem,
        currentItem.resolvedUrl || currentItem.sourceUrl
      );
      if (retried) return;

      const reason =
        errorCode === 403 || (error && error.includes('403'))
          ? 'Link expired or blocked (403). Please re-fetch link.'
          : error || `Background download error (${errorCode})`;
      await failQueueItem(task.id, currentItem.title, reason);
    });
}

async function launchNativeBackgroundTask(
  item: DownloadQueueItem,
  directUrl: string,
  customHeaders?: Record<string, string>
) {
  ensureBgConfigured();

  try {
    const destUri = item.destinationPath.startsWith('file://')
      ? item.destinationPath
      : `file://${item.destinationPath}`;
    const existing = await FileSystem.getInfoAsync(destUri);
    if (existing.exists) {
      await FileSystem.deleteAsync(destUri, { idempotent: true });
    }
  } catch {}

  speedSamplesMap.set(item.id, [{ timestamp: Date.now(), bytes: 0 }]);

  const headers = customHeaders || buildDownloadHeaders(directUrl, 'default');
  const metadata = {
    id: item.id,
    title: item.title,
    author: item.author || '',
    platform: item.platform,
    thumbnail: item.thumbnail || '',
    originalUrl: item.originalUrl,
    sourceUrl: item.sourceUrl,
    resolvedUrl: directUrl,
    qualityLabel: item.qualityLabel,
    isAudio: item.isAudio,
    filename: item.filename,
    destinationPath: item.destinationPath,
  };

  updateItem(item.id, (prev) => ({
    ...prev,
    resolvedUrl: directUrl,
    status: 'downloading',
    errorMessage: undefined,
    updatedAt: Date.now(),
    telemetry: {
      ...prev.telemetry,
      statusText: 'Starting background transfer...',
    },
  }));

  const bg = getBgDownloader();
  if (!bg) {
    await runExpoGoFallbackDownload(item, directUrl);
    return;
  }

  const task = bg.createDownloadTask({
    id: item.id,
    url: directUrl,
    destination: item.destinationPath,
    headers,
    metadata,
    notificationTitle: item.title,
  });

  attachNativeTaskHandlers(task, item);
  task.start();
}

async function runExpoGoFallbackDownload(item: DownloadQueueItem, directUrl: string) {
  const destUri = item.destinationPath.startsWith('file://')
    ? item.destinationPath
    : `file://${item.destinationPath}`;

  try {
    const existing = await FileSystem.getInfoAsync(destUri);
    if (existing.exists) {
      await FileSystem.deleteAsync(destUri, { idempotent: true });
    }
  } catch {}

  speedSamplesMap.set(item.id, [{ timestamp: Date.now(), bytes: 0 }]);

  const downloadResumable = FileSystem.createDownloadResumable(
    directUrl,
    destUri,
    { headers: buildDownloadHeaders(directUrl, 'default') },
    (progress) => {
      const now = Date.now();
      const samples = recordSpeedSample(
        speedSamplesMap.get(item.id) || [],
        progress.totalBytesWritten,
        now
      );
      speedSamplesMap.set(item.id, samples);

      updateItem(item.id, (prev) => ({
        ...prev,
        status: prev.status === 'paused' ? 'paused' : 'downloading',
        updatedAt: now,
        telemetry: computeDownloadTelemetry({
          writtenBytes: progress.totalBytesWritten,
          totalBytes: progress.totalBytesExpectedToWrite,
          samples,
          statusText: prev.isAudio ? 'Downloading MP3...' : 'Downloading video...',
        }),
      }));
    }
  );

  resumableTasks.set(item.id, downloadResumable);
  updateItem(item.id, (prev) => ({
    ...prev,
    resolvedUrl: directUrl,
    status: 'downloading',
    errorMessage: undefined,
    updatedAt: Date.now(),
  }));

  try {
    const result = await downloadResumable.downloadAsync();
    const latest = queueItems.find((i) => i.id === item.id);
    if (!latest || latest.status === 'cancelled' || latest.status === 'paused') return;

    if (!result || !result.uri) {
      throw new Error('Download failed: No file URI received.');
    }

    if (result.status && (result.status < 200 || result.status >= 300)) {
      throw new Error(`Server returned HTTP ${result.status}`);
    }

    const finalized = await validateAndFinalizeNativeFile(result.uri, item.isAudio);
    resumableTasks.delete(item.id);
    speedSamplesMap.delete(item.id);
    await recordSavedHistoryAndNotify(
      latest,
      finalized.localUri,
      finalized.savedToGallery,
      finalized.fileSize
    );
  } catch (err: unknown) {
    const latest = queueItems.find((i) => i.id === item.id);
    if (latest?.status === 'cancelled' || latest?.status === 'paused') return;
    const message = err instanceof Error ? err.message : 'Download failed';
    await failQueueItem(item.id, item.title, message);
  }
}

async function runWebStreamDownload(item: DownloadQueueItem, directUrl: string) {
  const controller = new AbortController();
  const controlState = {
    abortController: controller,
    paused: false,
    resumeWaiters: [] as Array<() => void>,
  };
  webControllers.set(item.id, controlState);
  speedSamplesMap.set(item.id, [{ timestamp: Date.now(), bytes: 0 }]);

  updateItem(item.id, (prev) => ({
    ...prev,
    resolvedUrl: directUrl,
    status: 'downloading',
    errorMessage: undefined,
    updatedAt: Date.now(),
    telemetry: {
      ...prev.telemetry,
      statusText: 'Connecting stream...',
    },
  }));

  try {
    const response = await fetch(directUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while downloading media`);
    }

    const headerLen = Number(response.headers.get('content-length') || '0');
    const totalBytes = Number.isFinite(headerLen) && headerLen > 0 ? headerLen : 0;
    const chunks: Uint8Array[] = [];
    let bytesDownloaded = 0;

    if (response.body && typeof response.body.getReader === 'function') {
      const reader = response.body.getReader();
      while (true) {
        if (controlState.paused) {
          await new Promise<void>((resolve) => {
            controlState.resumeWaiters.push(resolve);
          });
        }
        if (controller.signal.aborted) {
          throw new Error('Cancelled');
        }

        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          bytesDownloaded += value.byteLength;
          const now = Date.now();
          const samples = recordSpeedSample(
            speedSamplesMap.get(item.id) || [],
            bytesDownloaded,
            now
          );
          speedSamplesMap.set(item.id, samples);

          updateItem(item.id, (prev) => ({
            ...prev,
            status: controlState.paused ? 'paused' : 'downloading',
            updatedAt: now,
            telemetry: computeDownloadTelemetry({
              writtenBytes: bytesDownloaded,
              totalBytes: totalBytes > 0 ? totalBytes : bytesDownloaded,
              samples,
              statusText: prev.isAudio ? 'Downloading MP3...' : 'Downloading HD video...',
            }),
          }));
        }
      }
    } else {
      const buf = new Uint8Array(await response.arrayBuffer());
      chunks.push(buf);
      bytesDownloaded = buf.byteLength;
    }

    if (controller.signal.aborted) return;

    if (bytesDownloaded < MIN_VALID_MEDIA_BYTES && totalBytes > 0 && bytesDownloaded < totalBytes) {
      throw new Error('Downloaded stream was incomplete.');
    }

    const blobParts = chunks.map((chunk) => {
      const copy = new Uint8Array(chunk.byteLength);
      copy.set(chunk);
      return copy.buffer;
    });
    const blob = new Blob(blobParts, {
      type: item.isAudio ? 'audio/mpeg' : 'video/mp4',
    });
    const objectUrl =
      typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(blob)
        : directUrl;

    webControllers.delete(item.id);
    speedSamplesMap.delete(item.id);
    await recordSavedHistoryAndNotify(item, objectUrl, true, Math.max(bytesDownloaded, MIN_VALID_MEDIA_BYTES));
  } catch (err: unknown) {
    const latest = queueItems.find((i) => i.id === item.id);
    if (latest?.status === 'cancelled' || controller.signal.aborted) return;
    const message = err instanceof Error ? err.message : 'Download interrupted';
    await failQueueItem(item.id, item.title, message);
  }
}

async function startDownloadPipeline(item: DownloadQueueItem) {
  try {
    let resolvedUrl = item.sourceUrl;

    if (item.sourceUrl.startsWith('loader:')) {
      updateItem(item.id, (prev) => ({
        ...prev,
        status: 'resolving',
        errorMessage: undefined,
        updatedAt: Date.now(),
        telemetry: getEmptyTelemetry('Preparing high-speed stream...'),
      }));

      resolvedUrl = await resolveDownloadTargetUrl(
        item.sourceUrl,
        item.isAudio,
        item.originalUrl,
        (conversionPct, statusText) => {
          updateItem(item.id, (prev) => ({
            ...prev,
            status: 'resolving',
            updatedAt: Date.now(),
            telemetry: computeDownloadTelemetry({
              writtenBytes: 0,
              totalBytes: 0,
              samples: [],
              overridePercent: Math.min(25, Math.round(conversionPct * 25)),
              statusText: statusText || 'Preparing media stream...',
            }),
          }));
        }
      );
    } else {
      resolvedUrl = await resolveDownloadTargetUrl(item.sourceUrl, item.isAudio, item.originalUrl);
    }

    const latest = queueItems.find((i) => i.id === item.id);
    if (!latest || latest.status === 'cancelled') return;

    if (Platform.OS === 'web') {
      await runWebStreamDownload(latest, resolvedUrl);
    } else if (isNativeBackgroundDownloaderSupported()) {
      await launchNativeBackgroundTask(latest, resolvedUrl);
    } else {
      await runExpoGoFallbackDownload(latest, resolvedUrl);
    }
  } catch (err: unknown) {
    const latest = queueItems.find((i) => i.id === item.id);
    if (latest?.status === 'cancelled') return;
    const reason = err instanceof Error ? err.message : 'Unable to start download.';
    await failQueueItem(item.id, item.title, reason);
  }
}

export async function initializeDownloadQueue(): Promise<DownloadQueueSnapshot> {
  if (initialized) return buildSnapshot();
  initialized = true;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_QUEUE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        queueItems = parsed;
      }
    }
  } catch {}

  const recoveredIds = new Set<string>();

  if (isNativeBackgroundDownloaderSupported()) {
    try {
      ensureBgConfigured();
      const bg = getBgDownloader();
      const existingTasks = bg ? await bg.getExistingDownloadTasks() : [];

      for (const task of existingTasks) {
        recoveredIds.add(task.id);
        const meta = (task.metadata || {}) as Record<string, unknown>;
        let matched = queueItems.find((i) => i.id === task.id);

        if (!matched) {
          matched = {
            id: task.id,
            title: String(meta.title || 'Background Download'),
            author: typeof meta.author === 'string' ? meta.author : '',
            platform: (meta.platform as PlatformType) || 'unknown',
            thumbnail: typeof meta.thumbnail === 'string' ? meta.thumbnail : '',
            originalUrl: String(meta.originalUrl || ''),
            sourceUrl: String(meta.sourceUrl || ''),
            resolvedUrl: typeof meta.resolvedUrl === 'string' ? meta.resolvedUrl : undefined,
            qualityLabel: String(meta.qualityLabel || 'HD'),
            isAudio: Boolean(meta.isAudio),
            filename: String(meta.filename || `${task.id}.mp4`),
            destinationPath: String(meta.destinationPath || ''),
            status:
              task.state === 'PAUSED'
                ? 'paused'
                : task.state === 'DONE'
                  ? 'completed'
                  : 'downloading',
            telemetry: computeDownloadTelemetry({
              writtenBytes: task.bytesDownloaded || 0,
              totalBytes: task.bytesTotal || 0,
              samples: [],
              statusText: task.state === 'PAUSED' ? 'Paused' : 'Resuming background transfer...',
            }),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          queueItems = [matched, ...queueItems];
        } else {
          updateItem(matched.id, (prev) => ({
            ...prev,
            status:
              task.state === 'PAUSED'
                ? 'paused'
                : task.state === 'DONE'
                  ? 'completed'
                  : 'downloading',
            telemetry: computeDownloadTelemetry({
              writtenBytes: task.bytesDownloaded || prev.telemetry.downloadedBytes,
              totalBytes: task.bytesTotal || prev.telemetry.totalBytes,
              samples: [],
              statusText: task.state === 'PAUSED' ? 'Paused' : 'Background transfer active',
            }),
          }));
        }

        if (task.state === 'DONE') {
          const dest = String(meta.destinationPath || matched.destinationPath || '');
          if (dest) {
            void (async () => {
              try {
                const finalized = await validateAndFinalizeNativeFile(dest, matched!.isAudio);
                await recordSavedHistoryAndNotify(
                  matched!,
                  finalized.localUri,
                  finalized.savedToGallery,
                  finalized.fileSize || task.bytesDownloaded
                );
                getBgDownloader()?.completeHandler(task.id);
              } catch {}
            })();
          }
        } else {
          attachNativeTaskHandlers(task, matched);
        }
      }
    } catch (err) {
      console.warn('Could not recover background tasks:', err);
    }
  }

  // Mark any interrupted jobs not backed by an active OS task cleanly
  queueItems = queueItems.map((item) => {
    if (
      (item.status === 'downloading' || item.status === 'resolving' || item.status === 'queued') &&
      !recoveredIds.has(item.id)
    ) {
      return {
        ...item,
        status: 'failed',
        errorMessage: 'Download interrupted before completion. Tap Retry.',
        telemetry: {
          ...item.telemetry,
          speedBps: 0,
          speedText: '0 KB/s',
          etaText: '--',
          statusText: 'Interrupted — tap Retry',
        },
      };
    }
    return item;
  });

  emitQueueUpdate(true);
  return buildSnapshot();
}

export async function enqueueDownload(request: EnqueueDownloadRequest): Promise<DownloadQueueItem> {
  await initializeDownloadQueue();
  void requestGalleryPermissions();

  const isAudio = Boolean(request.isAudio);
  const safeFilename = sanitizeMediaFilename(`${request.filename}_${Date.now()}`, isAudio);
  const id = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  let destinationPath = safeFilename;
  if (Platform.OS !== 'web') {
    const bg = getBgDownloader();
    const baseDir =
      isNativeBackgroundDownloaderSupported() && bg?.directories?.documents
        ? bg.directories.documents
        : (FileSystem.documentDirectory || '').replace('file://', '');
    destinationPath = baseDir.endsWith('/') ? `${baseDir}${safeFilename}` : `${baseDir}/${safeFilename}`;
  }

  const item: DownloadQueueItem = {
    id,
    title: request.title || 'Media Download',
    author: request.author || '',
    platform: request.platform,
    thumbnail: request.thumbnail || '',
    originalUrl: request.originalUrl,
    sourceUrl: request.url,
    qualityLabel: request.qualityLabel,
    isAudio,
    filename: safeFilename,
    destinationPath,
    status: 'queued',
    telemetry: getEmptyTelemetry('Queued for download...'),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  queueItems = [item, ...queueItems];
  emitQueueUpdate(true);

  void startDownloadPipeline(item);
  return item;
}

export async function pauseDownload(id: string): Promise<void> {
  const nativeTask = nativeTasks.get(id);
  if (nativeTask) {
    try {
      await nativeTask.pause();
    } catch {}
  }

  const resumable = resumableTasks.get(id);
  if (resumable) {
    try {
      await resumable.pauseAsync();
    } catch {}
  }

  const webControl = webControllers.get(id);
  if (webControl) {
    webControl.paused = true;
  }

  speedSamplesMap.delete(id);
  updateItem(
    id,
    (prev) => ({
      ...prev,
      status: 'paused',
      updatedAt: Date.now(),
      telemetry: {
        ...prev.telemetry,
        speedBps: 0,
        speedText: '0 KB/s',
        etaText: 'Paused',
        statusText: 'Paused',
      },
    }),
    true
  );
}

export async function resumeDownload(id: string): Promise<void> {
  const item = queueItems.find((i) => i.id === id);
  if (!item) return;

  speedSamplesMap.set(id, [
    { timestamp: Date.now(), bytes: item.telemetry.downloadedBytes || 0 },
  ]);

  const nativeTask = nativeTasks.get(id);
  if (nativeTask) {
    updateItem(
      id,
      (prev) => ({
        ...prev,
        status: 'downloading',
        updatedAt: Date.now(),
        telemetry: { ...prev.telemetry, statusText: 'Resuming transfer...' },
      }),
      true
    );
    try {
      await nativeTask.resume();
    } catch {}
    return;
  }

  const webControl = webControllers.get(id);
  if (webControl) {
    webControl.paused = false;
    updateItem(
      id,
      (prev) => ({
        ...prev,
        status: 'downloading',
        updatedAt: Date.now(),
        telemetry: { ...prev.telemetry, statusText: 'Downloading...' },
      }),
      true
    );
    const waiters = webControl.resumeWaiters.splice(0, webControl.resumeWaiters.length);
    waiters.forEach((resolve) => resolve());
    return;
  }

  const resumable = resumableTasks.get(id);
  if (resumable) {
    updateItem(
      id,
      (prev) => ({
        ...prev,
        status: 'downloading',
        updatedAt: Date.now(),
        telemetry: { ...prev.telemetry, statusText: 'Resuming...' },
      }),
      true
    );
    try {
      const res = await resumable.resumeAsync();
      const latest = queueItems.find((i) => i.id === id);
      if (res && res.uri && latest) {
        const finalized = await validateAndFinalizeNativeFile(res.uri, latest.isAudio);
        resumableTasks.delete(id);
        await recordSavedHistoryAndNotify(
          latest,
          finalized.localUri,
          finalized.savedToGallery,
          finalized.fileSize
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resume failed';
      await failQueueItem(id, item.title, msg);
    }
    return;
  }

  await retryDownload(id);
}

export async function cancelDownload(id: string): Promise<void> {
  const nativeTask = nativeTasks.get(id);
  if (nativeTask) {
    nativeTasks.delete(id);
    try {
      await nativeTask.stop();
    } catch {}
  }

  const resumable = resumableTasks.get(id);
  if (resumable) {
    resumableTasks.delete(id);
    try {
      await resumable.cancelAsync();
    } catch {}
  }

  const webControl = webControllers.get(id);
  if (webControl) {
    webControl.paused = false;
    webControl.resumeWaiters.splice(0).forEach((resolve) => resolve());
    webControl.abortController.abort();
    webControllers.delete(id);
  }

  speedSamplesMap.delete(id);
  updateItem(
    id,
    (prev) => ({
      ...prev,
      status: 'cancelled',
      updatedAt: Date.now(),
      telemetry: {
        ...prev.telemetry,
        speedBps: 0,
        speedText: '0 KB/s',
        etaText: '--',
        statusText: 'Cancelled',
      },
    }),
    true
  );
}

export async function retryDownload(id: string): Promise<void> {
  const item = queueItems.find((i) => i.id === id);
  if (!item) return;

  speedSamplesMap.delete(id);
  updateItem(
    id,
    (prev) => ({
      ...prev,
      status: 'queued',
      errorMessage: undefined,
      updatedAt: Date.now(),
      telemetry: getEmptyTelemetry('Retrying download...'),
    }),
    true
  );

  const fresh = queueItems.find((i) => i.id === id);
  if (fresh) {
    void startDownloadPipeline(fresh);
  }
}

export function removeQueueItem(id: string): void {
  nativeTasks.delete(id);
  resumableTasks.delete(id);
  webControllers.delete(id);
  speedSamplesMap.delete(id);
  queueItems = queueItems.filter((item) => item.id !== id);
  emitQueueUpdate(true);
}

export function clearCompletedDownloads(): void {
  queueItems = queueItems.filter(
    (item) => item.status === 'queued' || item.status === 'resolving' || item.status === 'downloading' || item.status === 'paused'
  );
  emitQueueUpdate(true);
}

export function subscribeDownloadCompleted(callback: (item: DownloadHistoryItem) => void): () => void {
  completedCallbacks.add(callback);
  return () => {
    completedCallbacks.delete(callback);
  };
}

export function useDownloadQueue(): DownloadQueueSnapshot {
  const [snapshot, setSnapshot] = useState<DownloadQueueSnapshot>(() => buildSnapshot());

  useEffect(() => {
    queueListeners.add(setSnapshot);
    void initializeDownloadQueue().then(() => {
      setSnapshot(buildSnapshot());
    });

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isNativeBackgroundDownloaderSupported()) {
        // Re-sync task states after returning from background
        const bg = getBgDownloader();
        if (!bg) return;
        void bg
          .getExistingDownloadTasks()
          .then((tasks) => {
            tasks.forEach((task) => {
              const matched = queueItems.find((i) => i.id === task.id);
              if (matched) {
                attachNativeTaskHandlers(task, matched);
              }
            });
          })
          .catch(() => {});
      }
    });

    return () => {
      queueListeners.delete(setSnapshot);
      appStateSub.remove();
    };
  }, []);

  return snapshot;
}
