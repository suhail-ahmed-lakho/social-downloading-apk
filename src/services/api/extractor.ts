import { MediaMetadata, PlatformType, QualityOption } from '../../types';

// Helper to identify platform
export function detectPlatform(url: string): PlatformType {
  const cleanUrl = url.trim().toLowerCase();
  if (cleanUrl.includes('tiktok.com')) return 'tiktok';
  if (cleanUrl.includes('instagram.com') || cleanUrl.includes('instagr.am')) return 'instagram';
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) return 'youtube';
  return 'unknown';
}

// Extract YouTube ID (Supports regular videos, shorts, and music.youtube.com)
export function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|(?:www\.|m\.|music\.)?youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  return match ? match[1] : null;
}

// Extract Instagram shortcode
export function extractInstagramShortcode(url: string): string | null {
  const match = url.match(/(?:instagram\.com\/(?:p|reel|tv)\/)([\w-]+)/i);
  return match ? match[1] : null;
}

// Helper with strict timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ==========================================
// 1. TIKTOK EXTRACTOR (TikWM - No Watermark)
// ==========================================
async function extractTikTok(url: string): Promise<MediaMetadata> {
  const endpoint = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
  const response = await fetchWithTimeout(endpoint, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    },
  }, 7000);

  const resJson = await response.json();

  if (resJson && resJson.code === 0 && resJson.data) {
    const data = resJson.data;
    const playUrl = data.hdplay || data.play;
    const sdUrl = data.play;

    const qualityOptions: QualityOption[] = [];

    if (data.hdplay) {
      qualityOptions.push({
        label: 'HD (No Watermark)',
        url: data.hdplay.startsWith('http') ? data.hdplay : `https://www.tikwm.com${data.hdplay}`,
        type: 'video',
        quality: '1080p HD',
      });
    }

    if (sdUrl) {
      qualityOptions.push({
        label: 'Standard (No Watermark)',
        url: sdUrl.startsWith('http') ? sdUrl : `https://www.tikwm.com${sdUrl}`,
        type: 'video',
        quality: '720p SD',
      });
    }

    if (data.music) {
      qualityOptions.push({
        label: 'Audio Song (MP3)',
        url: data.music.startsWith('http') ? data.music : `https://www.tikwm.com${data.music}`,
        type: 'audio',
        quality: '128kbps',
      });
    }

    return {
      id: data.id || String(Date.now()),
      platform: 'tiktok',
      title: data.title || 'TikTok Video (No Watermark)',
      author: data.author?.nickname || data.author?.unique_id || 'TikTok Creator',
      authorAvatar: data.author?.avatar,
      thumbnail: data.cover || data.origin_cover || '',
      duration: data.duration,
      videoUrl: qualityOptions[0]?.url || playUrl,
      hdVideoUrl: data.hdplay ? (data.hdplay.startsWith('http') ? data.hdplay : `https://www.tikwm.com${data.hdplay}`) : undefined,
      audioUrl: data.music,
      originalUrl: url,
      qualityOptions,
    };
  }

  throw new Error('Could not download TikTok video. Please ensure the link is active.');
}

// ==========================================
// 2. YOUTUBE EXTRACTOR (Fast Verified Mirrors + Fallbacks + HQ Song MP3)
// ==========================================
const PIPED_MIRRORS = [
  'https://api.piped.private.coffee',
  'https://pipedapi.ducks.party',
  'https://pipedapi.kavin.rocks',
];

const INVIDIOUS_MIRRORS = [
  'https://invidious.f5.si',
  'https://inv.tux.pizza',
  'https://vid.puffyan.us',
];

async function extractYouTube(url: string): Promise<MediaMetadata> {
  const ytId = extractYouTubeId(url);
  if (!ytId) {
    throw new Error('Invalid YouTube URL. Please provide a valid YouTube Shorts, Video, or Music link.');
  }

  let isUnavailable = false;
  let oEmbedMeta: { title?: string; author?: string; thumbnail?: string } | null = null;

  // 1. Fast YouTube oEmbed metadata resolution (Guaranteed for all active videos & songs)
  try {
    const oRes = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`,
      {},
      3500
    );
    if (oRes.ok) {
      const oData = await oRes.json();
      oEmbedMeta = {
        title: oData.title,
        author: oData.author_name,
        thumbnail: oData.thumbnail_url || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      };
    } else if (oRes.status === 404 || oRes.status === 401) {
      isUnavailable = true;
    }
  } catch (err: any) {
    if (err.message && err.message.includes('unavailable')) {
      throw err;
    }
  }

  if (isUnavailable) {
    throw new Error('This YouTube video or song is unavailable, private, or has been removed.');
  }

  // 2. Try fast Piped mirrors (works great for shorts and standard videos)
  for (const mirror of PIPED_MIRRORS) {
    try {
      const response = await fetchWithTimeout(`${mirror}/streams/${ytId}`, {}, 3000);
      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      if (!data) continue;

      const qualityOptions: QualityOption[] = [];

      // Playable Video streams (MP4)
      if (data.videoStreams && Array.isArray(data.videoStreams)) {
        const mp4Streams = data.videoStreams.filter(
          (s: any) => s.url && (s.format === 'MPEG_4' || s.format === 'MP4' || s.mimeType?.includes('video/mp4'))
        );

        const listToUse = mp4Streams.length > 0 ? mp4Streams : data.videoStreams;

        for (const s of listToUse.slice(0, 4)) {
          qualityOptions.push({
            label: `${s.quality || 'Video'} (${s.format || 'MP4'})`,
            url: s.url,
            type: 'video',
            quality: s.quality || 'HD',
          });
        }
      }

      // Dedicated Audio / Song streams (MP3/M4A)
      if (data.audioStreams && Array.isArray(data.audioStreams) && data.audioStreams.length > 0) {
        const sortedAudio = [...data.audioStreams].sort(
          (a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0)
        );

        const bestAudio = sortedAudio[0];
        qualityOptions.push({
          label: `Song / MP3 (${bestAudio.quality || 'HQ Audio 320kbps'})`,
          url: bestAudio.url,
          type: 'audio',
          quality: 'HQ Audio',
        });

        if (sortedAudio.length > 1 && sortedAudio[1].url !== bestAudio.url) {
          qualityOptions.push({
            label: `Audio Stream (${sortedAudio[1].quality || '128kbps'})`,
            url: sortedAudio[1].url,
            type: 'audio',
            quality: 'Standard Audio',
          });
        }
      }

      if (qualityOptions.length > 0) {
        return {
          id: ytId,
          platform: 'youtube',
          title: data.title || oEmbedMeta?.title || 'YouTube Video / Song',
          author: data.uploader || oEmbedMeta?.author || 'YouTube Artist',
          authorAvatar: data.uploaderAvatar,
          thumbnail: data.thumbnailUrl || oEmbedMeta?.thumbnail || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          duration: data.duration,
          videoUrl: qualityOptions[0].url,
          originalUrl: url,
          qualityOptions,
        };
      }
    } catch (_) {}
  }

  // 3. Try Invidious mirrors
  for (const invMirror of INVIDIOUS_MIRRORS) {
    try {
      const invRes = await fetchWithTimeout(`${invMirror}/api/v1/videos/${ytId}`, {}, 3000);
      if (invRes.ok) {
        const invData = await invRes.json();
        const qualityOptions: QualityOption[] = [];

        // Combined streams
        if (invData.formatStreams && Array.isArray(invData.formatStreams)) {
          for (const s of invData.formatStreams) {
            if (s.url) {
              qualityOptions.push({
                label: `${s.quality || 'Video'} (${s.container?.toUpperCase() || 'MP4'})`,
                url: s.url,
                type: 'video',
                quality: s.quality || 'HD',
              });
            }
          }
        }

        // Adaptive formats (Shorts & Audio)
        if (invData.adaptiveFormats && Array.isArray(invData.adaptiveFormats)) {
          const videoFormats = invData.adaptiveFormats.filter(
            (f: any) =>
              f.url &&
              f.type &&
              f.type.startsWith('video/') &&
              (f.container === 'mp4' || f.type.includes('video/mp4'))
          );

          videoFormats.sort((a: any, b: any) => {
            const resA = parseInt(a.resolution || a.qualityLabel || '0', 10);
            const resB = parseInt(b.resolution || b.qualityLabel || '0', 10);
            return resB - resA;
          });

          const seenRes = new Set<string>();
          for (const v of videoFormats) {
            const resStr = v.qualityLabel || v.resolution || 'Video';
            if (!seenRes.has(resStr)) {
              seenRes.add(resStr);
              qualityOptions.push({
                label: `${resStr} HD Video (MP4)`,
                url: v.url,
                type: 'video',
                quality: resStr,
              });
            }
            if (seenRes.size >= 3) break;
          }

          // Audio Song Stream
          const audios = invData.adaptiveFormats.filter(
            (f: any) => f.url && f.type && (f.type.startsWith('audio/') || f.container === 'm4a')
          );
          if (audios.length > 0) {
            qualityOptions.push({
              label: 'Song / MP3 (HQ Audio)',
              url: audios[0].url,
              type: 'audio',
              quality: 'HQ Audio',
            });
            if (audios.length > 1) {
              qualityOptions.push({
                label: 'Audio Stream (Standard)',
                url: audios[1].url,
                type: 'audio',
                quality: 'Standard Audio',
              });
            }
          }
        }

        if (qualityOptions.length > 0) {
          const primaryVideo = qualityOptions.find((o) => o.type === 'video');
          return {
            id: ytId,
            platform: 'youtube',
            title: invData.title || oEmbedMeta?.title || 'YouTube Video / Song',
            author: invData.author || oEmbedMeta?.author || 'YouTube Artist',
            authorAvatar: invData.authorThumbnails?.[0]?.url,
            thumbnail: oEmbedMeta?.thumbnail || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
            duration: invData.lengthSeconds,
            videoUrl: primaryVideo ? primaryVideo.url : qualityOptions[0].url,
            originalUrl: url,
            qualityOptions,
          };
        }
      }
    } catch (_) {}
  }

  // 4. Bulletproof Fallback for 4-5 Minute Music Videos & Songs
  // If public Piped/Invidious servers are blocked by YouTube bot protection,
  // we use oEmbed metadata with our dedicated cloud stream resolver!
  const finalTitle = oEmbedMeta?.title || 'YouTube Song / Video';
  const finalAuthor = oEmbedMeta?.author || 'YouTube Artist';
  const finalThumb = oEmbedMeta?.thumbnail || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

  const fallbackOptions: QualityOption[] = [
    {
      label: 'Song / MP3 (HQ 320kbps)',
      url: `loader:mp3:${ytId}`,
      type: 'audio',
      quality: 'HQ Audio 320kbps',
    },
    {
      label: 'HD Video 720p (MP4)',
      url: `loader:720:${ytId}`,
      type: 'video',
      quality: '720p HD',
    },
    {
      label: 'Full HD 1080p (MP4)',
      url: `loader:1080:${ytId}`,
      type: 'video',
      quality: '1080p Full HD',
    },
    {
      label: 'Standard Video 360p (MP4)',
      url: `loader:360:${ytId}`,
      type: 'video',
      quality: '360p SD',
    },
    {
      label: 'Standard Audio (128kbps)',
      url: `loader:128:${ytId}`,
      type: 'audio',
      quality: '128kbps',
    },
  ];

  return {
    id: ytId,
    platform: 'youtube',
    title: finalTitle,
    author: finalAuthor,
    thumbnail: finalThumb,
    videoUrl: `loader:720:${ytId}`,
    audioUrl: `loader:mp3:${ytId}`,
    originalUrl: url,
    qualityOptions: fallbackOptions,
  };
}

// ==========================================
// 3. INSTAGRAM EXTRACTOR
// ==========================================
export class InstagramRequiresBrowserError extends Error {
  isInstagramLoginRequired = true;
  postUrl: string;

  constructor(message: string, postUrl: string) {
    super(message);
    this.name = 'InstagramRequiresBrowserError';
    this.postUrl = postUrl;
  }
}

async function extractInstagram(url: string): Promise<MediaMetadata> {
  const shortcode = extractInstagramShortcode(url);
  if (shortcode) {
    try {
      const res = await fetchWithTimeout(
        `https://www.instagram.com/reel/${shortcode}/embed/captioned/`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
        },
        3000
      );
      if (res.ok) {
        const html = await res.text();
        const mp4Matches = html.match(/https:\/\/[^"'\s\\]+?\.mp4[^"'\s\\]*/g);
        if (mp4Matches && mp4Matches.length > 0) {
          const directVideoUrl = mp4Matches[0].replace(/\\u0026/g, '&');
          return {
            id: shortcode,
            platform: 'instagram',
            title: 'Instagram Video (No Login)',
            author: 'Instagram Creator',
            thumbnail: '',
            videoUrl: directVideoUrl,
            originalUrl: url,
            qualityOptions: [
              {
                label: 'HD Video (No Watermark)',
                url: directVideoUrl,
                type: 'video',
                quality: '1080p HD',
              },
            ],
          };
        }
      }
    } catch {
      // Fallback to browser/headless extractor
    }
  }

  throw new InstagramRequiresBrowserError(
    'Instagram video requires headless session or browser.',
    url
  );
}

// ==========================================
// UNIFIED EXTRACTOR
// ==========================================
export async function extractMedia(url: string): Promise<MediaMetadata> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error('Please enter a valid video link.');
  }

  const platform = detectPlatform(trimmed);

  switch (platform) {
    case 'tiktok':
      return await extractTikTok(trimmed);
    case 'youtube':
      return await extractYouTube(trimmed);
    case 'instagram':
      return await extractInstagram(trimmed);
    default:
      // Try YouTube fallback if URL has watch or youtu.be
      if (trimmed.includes('youtu')) {
        return await extractYouTube(trimmed);
      }
      throw new Error('Unsupported link. Please paste a link from TikTok, Instagram, or YouTube.');
  }
}
