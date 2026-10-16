export type PlatformType = 'tiktok' | 'instagram' | 'youtube' | 'youtube_music' | 'unknown';

export interface QualityOption {
  label: string;
  url: string;
  type: 'video' | 'audio';
  quality?: string;
}

export interface MediaMetadata {
  id: string;
  platform: PlatformType;
  title: string;
  author: string;
  authorAvatar?: string;
  thumbnail: string;
  duration?: number | string;
  videoUrl: string;
  hdVideoUrl?: string;
  audioUrl?: string;
  originalUrl: string;
  qualityOptions: QualityOption[];
}

export interface DownloadHistoryItem {
  id: string;
  platform: PlatformType;
  title: string;
  author: string;
  thumbnail: string;
  localUri: string;
  originalUrl: string;
  fileSize?: number;
  createdAt: number;
}
