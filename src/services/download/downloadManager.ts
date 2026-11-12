import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { resolveYouTubeDownloadUrl } from '../api/youtubeResolver';
import { cleanInstagramMediaUrl } from '../api/extractor';

export interface DownloadProgressInfo {
  percent: number; // 0 to 100
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  statusText?: string;
}

export interface DownloadOptions {
  url: string;
  filename: string;
  isAudio?: boolean;
  originalUrl?: string;
  onProgress?: (info: DownloadProgressInfo) => void;
}

export interface DownloadResult {
  localUri: string;
  savedToGallery: boolean;
  fileSize?: number;
}

export const MIN_VALID_MEDIA_BYTES = 5120;

export async function requestGalleryPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    if (!MediaLibrary || typeof MediaLibrary.requestPermissionsAsync !== 'function') {
      return false;
    }
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Failed to request gallery permissions:', error);
    return false;
  }
}

export function sanitizeMediaFilename(filename: string, isAudio = false): string {
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const extension = isAudio ? '.mp3' : '.mp4';
  return cleanName.endsWith(extension) ? cleanName : `${cleanName}${extension}`;
}

export function isMetaCdnUrl(url: string): boolean {
  return (
    url.includes('instagram.com') ||
    url.includes('cdninstagram.com') ||
    url.includes('fbcdn.net')
  );
}

export function extractDirectUrlFromRapidCdn(url: string): string | null {
  try {
    const match = url.match(/token=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
    if (!match) return null;
    const parts = match[1].split('.');
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    const cleanStr = String(base64).replace(/=+$/, '');
    for (
      let bc = 0, bs = 0, buffer: number, idx = 0;
      (buffer = cleanStr.charCodeAt(idx++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(String.fromCharCode(buffer));
    }
    const parsed = JSON.parse(output);
    return parsed?.url || null;
  } catch {
    return null;
  }
}

export function buildDownloadHeaders(
  finalDirectUrl: string,
  variant: 'default' | 'no-referer' | 'bot-direct' = 'default'
): Record<string, string> {
  if (variant === 'no-referer') {
    return {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: '*/*',
      'Accept-Encoding': 'identity',
    };
  }

  if (variant === 'bot-direct') {
    return {
      'User-Agent': 'TelegramBot (like TwitterBot)',
      Accept: '*/*',
      'Accept-Encoding': 'identity',
    };
  }

  const downloadHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    Accept: '*/*',
    'Accept-Encoding': 'identity',
  };

  if (isMetaCdnUrl(finalDirectUrl)) {
    downloadHeaders['Referer'] = 'https://www.instagram.com/';
    downloadHeaders['Origin'] = 'https://www.instagram.com';
    downloadHeaders['Sec-Fetch-Dest'] = 'video';
    downloadHeaders['Sec-Fetch-Mode'] = 'cors';
    downloadHeaders['Sec-Fetch-Site'] = 'cross-site';
  } else if (finalDirectUrl.includes('rapidcdn.app') || finalDirectUrl.includes('snapsave.app')) {
    downloadHeaders['Referer'] = 'https://snapsave.app/';
    downloadHeaders['Origin'] = 'https://snapsave.app';
  } else if (
    finalDirectUrl.includes('tiktok.com') ||
    finalDirectUrl.includes('tiktokcdn.com') ||
    finalDirectUrl.includes('tikwm.com')
  ) {
    downloadHeaders['Referer'] = 'https://www.tiktok.com/';
  } else if (
    finalDirectUrl.includes('twimg.com') ||
    finalDirectUrl.includes('twitter.com') ||
    finalDirectUrl.includes('x.com')
  ) {
    downloadHeaders['Referer'] = 'https://twitter.com/';
  } else if (
    finalDirectUrl.includes('loader.to') ||
    finalDirectUrl.includes('savenow.to') ||
    finalDirectUrl.includes('affadaffa.com')
  ) {
    downloadHeaders['Referer'] = 'https://loader.to/';
  }

  return downloadHeaders;
}

export async function resolveDownloadTargetUrl(
  rawUrl: string,
  isAudio: boolean,
  originalUrl?: string,
  onConversionProgress?: (conversionRatio: number, statusText?: string) => void
): Promise<string> {
  let finalDirectUrl = cleanInstagramMediaUrl(rawUrl);

  if (rawUrl.startsWith('loader:')) {
    const parts = rawUrl.split(':');
    const format = parts[1] || (isAudio ? 'mp3' : '720');
    const targetIdOrUrl = parts[2] || originalUrl || rawUrl;

    finalDirectUrl = await resolveYouTubeDownloadUrl(
      targetIdOrUrl,
      format,
      (conversionPct, status) => {
        if (onConversionProgress) {
          onConversionProgress(conversionPct, status);
        }
      }
    );
  }

  if (!finalDirectUrl || !finalDirectUrl.startsWith('http')) {
    throw new Error('Unable to resolve download URL. Please try again.');
  }

  return finalDirectUrl;
}

export async function validateAndFinalizeNativeFile(
  fileUri: string,
  isAudio: boolean
): Promise<{ localUri: string; savedToGallery: boolean; fileSize: number }> {
  const normalizedUri = fileUri.startsWith('file://') || fileUri.startsWith('content://')
    ? fileUri
    : `file://${fileUri}`;

  const fileInfo = await FileSystem.getInfoAsync(normalizedUri);
  if (!fileInfo.exists || (fileInfo.size ?? 0) < MIN_VALID_MEDIA_BYTES) {
    try {
      await FileSystem.deleteAsync(normalizedUri, { idempotent: true });
    } catch {}
    throw new Error('Downloaded file is incomplete or 0.0 MB. Please try another resolution.');
  }

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}

  let savedToGallery = false;
  try {
    const hasPermission = await requestGalleryPermissions();
    if (hasPermission && typeof MediaLibrary.createAssetAsync === 'function') {
      const asset = await MediaLibrary.createAssetAsync(normalizedUri);
      try {
        const albumName = isAudio ? 'OmniSaver Songs' : 'OmniSaver';
        const album = await MediaLibrary.getAlbumAsync(albumName);
        if (album == null) {
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (albumErr) {
        console.warn('Could not add to custom album, but asset was registered:', albumErr);
      }
      savedToGallery = true;
    }
  } catch (mediaError) {
    console.warn('Could not register to media library:', mediaError);
  }

  return {
    localUri: normalizedUri,
    savedToGallery,
    fileSize: fileInfo.size ?? 0,
  };
}

export async function downloadAndSaveMedia(options: DownloadOptions): Promise<DownloadResult> {
  const { url, filename, isAudio = false, originalUrl, onProgress } = options;

  const finalDirectUrl = await resolveDownloadTargetUrl(
    url,
    isAudio,
    originalUrl,
    (conversionPct, status) => {
      if (onProgress) {
        onProgress({
          percent: Math.min(45, Math.round(conversionPct * 45)),
          totalBytesWritten: 0,
          totalBytesExpectedToWrite: 0,
          statusText: status,
        });
      }
    }
  );

  const targetName = sanitizeMediaFilename(filename, isAudio);
  const targetDir = FileSystem.documentDirectory || '';
  const localUri = `${targetDir}${targetName}`;

  try {
    const existing = await FileSystem.getInfoAsync(localUri);
    if (existing.exists) {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
    }
  } catch {}

  if (onProgress) {
    onProgress({
      percent: url.startsWith('loader:') ? 45 : 5,
      totalBytesWritten: 0,
      totalBytesExpectedToWrite: 0,
      statusText: isAudio ? 'Downloading MP3 song...' : 'Downloading HD video...',
    });
  }

  const downloadHeaders = buildDownloadHeaders(finalDirectUrl, 'default');
  const isMetaCdn = isMetaCdnUrl(finalDirectUrl);

  const downloadResumable = FileSystem.createDownloadResumable(
    finalDirectUrl,
    localUri,
    { headers: downloadHeaders },
    (downloadProgress: FileSystem.DownloadProgressData) => {
      if (onProgress && downloadProgress.totalBytesExpectedToWrite > 0) {
        const rawPct = Math.min(
          100,
          Math.round((downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100)
        );
        const scaledPercent = url.startsWith('loader:')
          ? Math.min(100, 45 + Math.round(rawPct * 0.55))
          : rawPct;

        onProgress({
          percent: scaledPercent,
          totalBytesWritten: downloadProgress.totalBytesWritten,
          totalBytesExpectedToWrite: downloadProgress.totalBytesExpectedToWrite,
          statusText: isAudio ? 'Saving high-quality MP3 audio...' : 'Saving HD video...',
        });
      }
    }
  );

  let downloadResult = await downloadResumable.downloadAsync();
  if (!downloadResult || !downloadResult.uri) {
    throw new Error('Download failed: No file URI received.');
  }

  if (downloadResult.status === 403 && isMetaCdn) {
    try {
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
    } catch {}

    const retryResumable = FileSystem.createDownloadResumable(
      finalDirectUrl,
      localUri,
      { headers: buildDownloadHeaders(finalDirectUrl, 'no-referer') }
    );
    const retryResult = await retryResumable.downloadAsync();
    if (retryResult && retryResult.uri) {
      downloadResult = retryResult;
    }
  }

  if (
    downloadResult &&
    downloadResult.status &&
    (downloadResult.status < 200 || downloadResult.status >= 300) &&
    finalDirectUrl.includes('rapidcdn.app')
  ) {
    const directMetaUrl = extractDirectUrlFromRapidCdn(finalDirectUrl);
    if (directMetaUrl && directMetaUrl.startsWith('http')) {
      try {
        await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
      } catch {}

      const fallbackResumable = FileSystem.createDownloadResumable(
        directMetaUrl,
        localUri,
        { headers: buildDownloadHeaders(directMetaUrl, 'bot-direct') }
      );
      const fallbackResult = await fallbackResumable.downloadAsync();
      if (fallbackResult && fallbackResult.uri) {
        downloadResult = fallbackResult;
      }
    }
  }

  if (!downloadResult || !downloadResult.uri) {
    throw new Error('Download failed: No file URI received.');
  }

  if (downloadResult.status && (downloadResult.status < 200 || downloadResult.status >= 300)) {
    try {
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
    } catch {}
    throw new Error(`Download failed with server error ${downloadResult.status}. Stream may be expired or restricted.`);
  }

  return validateAndFinalizeNativeFile(downloadResult.uri, isAudio);
}

export async function shareDownloadedMedia(localUri: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = localUri;
      a.download = localUri.split('/').pop() || 'omnisaver-media';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    return;
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  const fileInfo = await FileSystem.getInfoAsync(localUri);
  if (!fileInfo.exists || (fileInfo.size ?? 0) < MIN_VALID_MEDIA_BYTES) {
    throw new Error('Cannot share: File is 0.0 MB or corrupt. Please re-download.');
  }

  const isAudio = localUri.toLowerCase().endsWith('.mp3') || localUri.toLowerCase().endsWith('.m4a');

  await Sharing.shareAsync(localUri, {
    mimeType: isAudio ? 'audio/mpeg' : 'video/mp4',
    dialogTitle: isAudio ? 'Share Downloaded Song (MP3)' : 'Share Downloaded Video',
    UTI: isAudio ? 'public.mp3' : 'public.mpeg-4',
  });
}
