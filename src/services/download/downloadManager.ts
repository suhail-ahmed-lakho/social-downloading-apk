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
    if (typeof MediaLibrary.getPermissionsAsync === 'function') {
      const existing = await MediaLibrary.getPermissionsAsync();
      if (existing.status === 'granted') {
        return true;
      }
    }
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Failed to request gallery permissions:', error);
    return false;
  }
}

export function sanitizeMediaFilename(
  filename: string,
  isAudio = false,
  explicitExt?: '.mp4' | '.mp3' | '.m4a'
): string {
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const extension = explicitExt || (isAudio ? '.mp3' : '.mp4');
  if (
    cleanName.toLowerCase().endsWith('.mp4') ||
    cleanName.toLowerCase().endsWith('.mp3') ||
    cleanName.toLowerCase().endsWith('.m4a')
  ) {
    return cleanName.replace(/\.(mp4|mp3|m4a)$/i, extension);
  }
  return `${cleanName}${extension}`;
}

export function decodeBase64Prefix(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const out: number[] = [];
  for (let i = 0; i + 3 < clean.length; i += 4) {
    const a = lookup.indexOf(clean[i]);
    const b = lookup.indexOf(clean[i + 1]);
    const c = clean[i + 2] === '=' ? -1 : lookup.indexOf(clean[i + 2]);
    const d = clean[i + 3] === '=' ? -1 : lookup.indexOf(clean[i + 3]);
    if (a < 0 || b < 0) break;
    out.push((a << 2) | (b >> 4));
    if (c >= 0) {
      out.push(((b & 15) << 4) | (c >> 2));
      if (d >= 0) {
        out.push(((c & 3) << 6) | d);
      }
    }
  }
  return new Uint8Array(out);
}

/**
 * Inspects initial container header bytes to catch HTML/JSON error pages or corrupt streams
 * saved with 200 OK status on chunked transfers.
 */
export function inspectMediaHeaderBytes(
  bytes: Uint8Array,
  expectedExt?: '.mp4' | '.mp3' | '.m4a',
  isAudio = false
): { valid: boolean; detectedExt?: '.mp4' | '.mp3' | '.m4a'; reason?: string } {
  if (!bytes || bytes.length < 12) {
    return { valid: false, reason: 'Downloaded file header is empty or too short.' };
  }

  let asciiPrefix = '';
  const sampleLen = Math.min(bytes.length, 96);
  for (let i = 0; i < sampleLen; i++) {
    const ch = bytes[i];
    asciiPrefix += ch >= 32 && ch <= 126 ? String.fromCharCode(ch) : '.';
  }
  const lowerTrimmed = asciiPrefix.trim().toLowerCase();

  if (
    lowerTrimmed.startsWith('<!doc') ||
    lowerTrimmed.startsWith('<html') ||
    lowerTrimmed.startsWith('<head') ||
    lowerTrimmed.startsWith('<?xml') ||
    lowerTrimmed.startsWith('{"') ||
    lowerTrimmed.startsWith('{"error')
  ) {
    return { valid: false, reason: 'Server returned an HTML/JSON error page instead of playable media.' };
  }

  // ISO BMFF (MP4 / M4A): 'ftyp' at bytes 4..7 (or within first 16 bytes)
  for (let offset = 0; offset + 7 < Math.min(bytes.length, 24); offset++) {
    if (
      bytes[offset] === 0x66 &&
      bytes[offset + 1] === 0x74 &&
      bytes[offset + 2] === 0x79 &&
      bytes[offset + 3] === 0x70
    ) {
      return {
        valid: true,
        detectedExt: isAudio || expectedExt === '.m4a' ? '.m4a' : '.mp4',
      };
    }
  }

  // ID3v2 header ('ID3') or raw MPEG ADTS/MP3 frame sync (0xFF 0xE0..)
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return { valid: true, detectedExt: '.mp3' };
  }
  for (let i = 0; i + 1 < Math.min(bytes.length, 256); i++) {
    if (bytes[i] === 0xff && (bytes[i + 1] & 0xe0) === 0xe0 && (bytes[i + 1] & 0x06) !== 0x00) {
      return { valid: true, detectedExt: '.mp3' };
    }
  }

  // WebM / Matroska EBML header (0x1A 0x45 0xDF 0xA3)
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { valid: true, detectedExt: isAudio ? '.m4a' : '.mp4' };
  }

  // Ogg container ('OggS')
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return { valid: true, detectedExt: isAudio ? '.m4a' : '.mp4' };
  }

  return {
    valid: false,
    reason: 'Downloaded file has an unrecognized or corrupt container header.',
  };
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
  isAudio: boolean,
  options?: {
    expectedExt?: '.mp4' | '.mp3' | '.m4a';
    estimatedBytes?: number;
  }
): Promise<{ localUri: string; savedToGallery: boolean; fileSize: number }> {
  const normalizedUri = fileUri.startsWith('file://') || fileUri.startsWith('content://')
    ? fileUri
    : `file://${fileUri}`;

  const fileInfo = await FileSystem.getInfoAsync(normalizedUri);
  const actualSize = fileInfo.exists ? (fileInfo.size ?? 0) : 0;

  if (!fileInfo.exists || actualSize < MIN_VALID_MEDIA_BYTES) {
    try {
      await FileSystem.deleteAsync(normalizedUri, { idempotent: true });
    } catch {}
    throw new Error('Downloaded file is incomplete or 0.0 MB. Please try another resolution.');
  }

  // Guard against truncated chunked streams (when converter omits Content-Length and drops early)
  const est = options?.estimatedBytes ?? 0;
  if (isAudio && est >= 350_000 && actualSize < est * 0.2) {
    try {
      await FileSystem.deleteAsync(normalizedUri, { idempotent: true });
    } catch {}
    throw new Error(
      `Song download was cut short (${Math.round(actualSize / 1024)} KB received). Retrying cleanly...`
    );
  }
  if (!isAudio && est >= 2_000_000 && actualSize < 120_000) {
    try {
      await FileSystem.deleteAsync(normalizedUri, { idempotent: true });
    } catch {}
    throw new Error('Video stream ended prematurely before completing. Please retry or use 1080p/720p.');
  }

  // Inspect file header magic bytes to reject HTML/JSON error pages or corrupt headers
  try {
    const headerB64 = await FileSystem.readAsStringAsync(normalizedUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: 0,
      length: 512,
    });
    if (headerB64 && headerB64.length >= 16) {
      const headerCheck = inspectMediaHeaderBytes(
        decodeBase64Prefix(headerB64),
        options?.expectedExt,
        isAudio
      );
      if (!headerCheck.valid) {
        try {
          await FileSystem.deleteAsync(normalizedUri, { idempotent: true });
        } catch {}
        throw new Error(headerCheck.reason || 'Downloaded media file is corrupt.');
      }
    }
  } catch (inspectErr: any) {
    if (inspectErr?.message && inspectErr.message.includes('Downloaded')) {
      throw inspectErr;
    }
    // Ignore storage read option incompatibility on unsupported URIs
  }

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}

  let savedToGallery = false;
  try {
    const hasPermission = await requestGalleryPermissions();
    if (hasPermission) {
      const albumName = isAudio ? 'OmniSaver Songs' : 'OmniSaver';
      let savedDirectlyToAlbum = false;

      if (Platform.OS === 'android') {
        try {
          const album = await MediaLibrary.getAlbumAsync(albumName);
          if (album != null) {
            // Insert asset straight into the target album without moving existing MediaStore rows
            // (moving with copyAsset=false triggers Android's "Allow app to modify this video?" dialog).
            await MediaLibrary.createAssetAsync(normalizedUri, album);
            savedDirectlyToAlbum = true;
          } else {
            // Creating an album directly from initialAssetLocalUri avoids MediaStore.createWriteRequest prompts.
            await MediaLibrary.createAlbumAsync(albumName, undefined, true, normalizedUri);
            savedDirectlyToAlbum = true;
          }
        } catch (albumErr) {
          console.warn('Direct album save unavailable on this ROM, falling back to system folder:', albumErr);
        }
      }

      if (!savedDirectlyToAlbum) {
        if (typeof MediaLibrary.saveToLibraryAsync === 'function') {
          await MediaLibrary.saveToLibraryAsync(normalizedUri);
        } else if (typeof MediaLibrary.createAssetAsync === 'function') {
          await MediaLibrary.createAssetAsync(normalizedUri);
        }
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

  const explicitExt = url.startsWith('loader:m4a:') ? '.m4a' : undefined;
  const targetName = sanitizeMediaFilename(filename, isAudio, explicitExt);
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

  return validateAndFinalizeNativeFile(downloadResult.uri, isAudio, { expectedExt: explicitExt });
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

  const lowerUri = localUri.toLowerCase();
  const isM4a = lowerUri.endsWith('.m4a');
  const isMp3 = lowerUri.endsWith('.mp3');
  const isAudio = isM4a || isMp3;

  await Sharing.shareAsync(localUri, {
    mimeType: isM4a ? 'audio/mp4' : isMp3 ? 'audio/mpeg' : 'video/mp4',
    dialogTitle: isM4a
      ? 'Share Downloaded Song (M4A)'
      : isAudio
        ? 'Share Downloaded Song (MP3)'
        : 'Share Downloaded Video',
    UTI: isM4a ? 'public.mpeg-4-audio' : isMp3 ? 'public.mp3' : 'public.mpeg-4',
  });
}
