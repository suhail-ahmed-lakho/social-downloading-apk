import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { resolveYouTubeDownloadUrl } from '../api/youtubeResolver';

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

export async function requestGalleryPermissions(): Promise<boolean> {
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

export async function downloadAndSaveMedia(options: DownloadOptions): Promise<DownloadResult> {
  const { url, filename, isAudio = false, originalUrl, onProgress } = options;

  let finalDirectUrl = url;

  // Resolve cloud conversion stream if option requires loader resolution
  if (url.startsWith('loader:')) {
    const parts = url.split(':');
    const format = parts[1] || (isAudio ? 'mp3' : '720');
    const targetIdOrUrl = parts[2] || originalUrl || url;

    finalDirectUrl = await resolveYouTubeDownloadUrl(
      targetIdOrUrl,
      format,
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
  }

  if (!finalDirectUrl || !finalDirectUrl.startsWith('http')) {
    throw new Error('Unable to resolve download URL. Please try again.');
  }

  // Clean filename
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const extension = isAudio ? '.mp3' : '.mp4';
  const targetName = cleanName.endsWith(extension) ? cleanName : `${cleanName}${extension}`;
  
  const targetDir = FileSystem.documentDirectory || '';
  const localUri = `${targetDir}${targetName}`;

  // Clean up any stale or 0-byte file from a previous failed attempt
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

  // Build browser-compatible headers to prevent CDN 403 Forbidden blocks
  const downloadHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
    'Accept': '*/*',
    'Accept-Encoding': 'identity',
  };

  if (finalDirectUrl.includes('instagram.com') || finalDirectUrl.includes('cdninstagram.com') || finalDirectUrl.includes('fbcdn.net')) {
    downloadHeaders['Referer'] = 'https://www.instagram.com/';
  } else if (finalDirectUrl.includes('tiktok.com') || finalDirectUrl.includes('tiktokcdn.com') || finalDirectUrl.includes('tikwm.com')) {
    downloadHeaders['Referer'] = 'https://www.tiktok.com/';
  } else if (finalDirectUrl.includes('twimg.com') || finalDirectUrl.includes('twitter.com') || finalDirectUrl.includes('x.com')) {
    downloadHeaders['Referer'] = 'https://twitter.com/';
  } else if (finalDirectUrl.includes('loader.to') || finalDirectUrl.includes('savenow.to') || finalDirectUrl.includes('affadaffa.com')) {
    downloadHeaders['Referer'] = 'https://loader.to/';
  }

  // Create download resumable
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

  const downloadResult = await downloadResumable.downloadAsync();
  if (!downloadResult || !downloadResult.uri) {
    throw new Error('Download failed: No file URI received.');
  }

  // Verify HTTP status code (detect 401, 403, 404, 500 error pages)
  if (downloadResult.status && (downloadResult.status < 200 || downloadResult.status >= 300)) {
    try {
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
    } catch {}
    throw new Error(`Download failed with server error ${downloadResult.status}. Stream may be expired or restricted.`);
  }

  // Verify file size (detect 0-byte or corrupt error text files)
  const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
  if (!fileInfo.exists || fileInfo.size < 5120) {
    try {
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
    } catch {}
    throw new Error('Downloaded file is incomplete or 0.0 MB. Please try another resolution.');
  }

  // Trigger success vibration
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Ignore in web/unsupported
  }

  // Save to Media Library / Gallery
  let savedToGallery = false;
  try {
    const hasPermission = await requestGalleryPermissions();
    if (hasPermission && typeof MediaLibrary.createAssetAsync === 'function') {
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      
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
    localUri: downloadResult.uri,
    savedToGallery,
    fileSize: fileInfo.exists ? fileInfo.size : undefined,
  };
}

export async function shareDownloadedMedia(localUri: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  const fileInfo = await FileSystem.getInfoAsync(localUri);
  if (!fileInfo.exists || fileInfo.size < 5120) {
    throw new Error('Cannot share: File is 0.0 MB or corrupt. Please re-download.');
  }

  const isAudio = localUri.toLowerCase().endsWith('.mp3') || localUri.toLowerCase().endsWith('.m4a');

  await Sharing.shareAsync(localUri, {
    mimeType: isAudio ? 'audio/mpeg' : 'video/mp4',
    dialogTitle: isAudio ? 'Share Downloaded Song (MP3)' : 'Share Downloaded Video',
    UTI: isAudio ? 'public.mp3' : 'public.mpeg-4',
  });
}
