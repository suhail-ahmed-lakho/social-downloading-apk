import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export interface DownloadProgressInfo {
  percent: number; // 0 to 100
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
}

export interface DownloadOptions {
  url: string;
  filename: string;
  isAudio?: boolean;
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
  const { url, filename, isAudio = false, onProgress } = options;

  // Clean filename
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const extension = isAudio ? '.mp3' : '.mp4';
  const targetName = cleanName.endsWith(extension) ? cleanName : `${cleanName}${extension}`;
  
  const targetDir = FileSystem.documentDirectory || '';
  const localUri = `${targetDir}${targetName}`;

  // Create download resumable
  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    localUri,
    {},
    (downloadProgress) => {
      if (onProgress && downloadProgress.totalBytesExpectedToWrite > 0) {
        const percent = Math.min(
          100,
          Math.round((downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100)
        );
        onProgress({
          percent,
          totalBytesWritten: downloadProgress.totalBytesWritten,
          totalBytesExpectedToWrite: downloadProgress.totalBytesExpectedToWrite,
        });
      }
    }
  );

  const downloadResult = await downloadResumable.downloadAsync();
  if (!downloadResult || !downloadResult.uri) {
    throw new Error('Download failed: No file URI received.');
  }

  // Get file info
  const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);

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

  const isAudio = localUri.toLowerCase().endsWith('.mp3') || localUri.toLowerCase().endsWith('.m4a');

  await Sharing.shareAsync(localUri, {
    mimeType: isAudio ? 'audio/mpeg' : 'video/mp4',
    dialogTitle: isAudio ? 'Share Downloaded Song (MP3)' : 'Share Downloaded Video',
  });
}
