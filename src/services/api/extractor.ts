import { MediaMetadata, PlatformType, QualityOption } from '../../types';

// Helper to isolate URL from shared text / clipboard
export function cleanInputUrl(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // If user pasted surrounding text or concatenated links from WhatsApp / Instagram share sheet:
  // e.g. "Watch this reel https://www.instagram.com/reel/XYZ/?igsh=... on Instagram"
  const urlMatch = trimmed.match(/https?:\/\/(?:(?!https?:\/\/)[^\s"'<>])+/i);
  if (urlMatch) {
    return urlMatch[0];
  }
  return trimmed;
}

// Unescape and clean captured Instagram video CDN URLs (fixing 403 Forbidden caused by chopped tokens or escaped slashes/ampersands)
export function cleanInstagramMediaUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Unescape JSON escaped slashes (\/ -> /)
  url = url.replace(/\\\/+/g, '/');
  // Unescape unicode ampersands (\u0026 -> &)
  url = url.replace(/\\u0026/g, '&');
  // Unescape HTML entities (&amp; -> &)
  url = url.replace(/&amp;/g, '&');
  // Remove trailing quotes, backslashes, or brackets
  url = url.replace(/["'\\\s]+$/, '');
  return url;
}

// Helper to identify platform
export function detectPlatform(url: string): PlatformType {
  const cleanUrl = cleanInputUrl(url).toLowerCase();
  if (cleanUrl.includes('tiktok.com')) return 'tiktok';
  if (
    cleanUrl.includes('instagram.com') ||
    cleanUrl.includes('instagr.am') ||
    cleanUrl.includes('ddinstagram.com')
  ) {
    return 'instagram';
  }
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) return 'youtube';
  return 'unknown';
}

// Extract YouTube ID (Supports regular videos, shorts, and music.youtube.com)
export function extractYouTubeId(url: string): string | null {
  const clean = cleanInputUrl(url);
  const match = clean.match(/(?:youtu\.be\/|(?:www\.|m\.|music\.)?youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  return match ? match[1] : null;
}

// Extract Instagram shortcode (Supports /reel/, /reels/, /p/, /tv/, /share/reel/, username/reel/)
export function extractInstagramShortcode(url: string): string | null {
  const clean = cleanInputUrl(url);
  const match =
    clean.match(/(?:instagram\.com|instagr\.am)\/(?:share\/)?(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i) ||
    clean.match(/(?:instagram\.com|instagr\.am)\/[^/]+\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
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
// 1. TIKTOK EXTRACTOR (TikWM + TikMate Fallback)
// ==========================================
async function extractTikTok(url: string): Promise<MediaMetadata> {
  // Tier 1: TikWM (No Watermark HD)
  try {
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

      if (qualityOptions.length > 0) {
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
    }
  } catch (_) {}

  // Tier 2: TikMate Fallback
  try {
    const tmRes = await fetchWithTimeout('https://api.tikmate.app/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      body: `url=${encodeURIComponent(url)}`,
    }, 7000);

    if (tmRes.ok) {
      const tmData = await tmRes.json();
      if (tmData && tmData.token && tmData.id) {
        return {
          id: tmData.id,
          platform: 'tiktok',
          title: tmData.desc || 'TikTok Video (No Watermark)',
          author: tmData.author_name || 'TikTok Creator',
          thumbnail: tmData.cover || '',
          duration: 0,
          videoUrl: `https://tikmate.app/download/${tmData.token}/${tmData.id}.mp4?hd=1`,
          originalUrl: url,
          qualityOptions: [
            {
              label: 'HD Video (No Watermark)',
              url: `https://tikmate.app/download/${tmData.token}/${tmData.id}.mp4?hd=1`,
              type: 'video',
              quality: '1080p HD',
            },
            {
              label: 'Standard Video (No Watermark)',
              url: `https://tikmate.app/download/${tmData.token}/${tmData.id}.mp4`,
              type: 'video',
              quality: '720p SD',
            },
          ],
        };
      }
    }
  } catch (_) {}

  throw new Error('Could not download TikTok video. Please ensure the link is active.');
}

// ==========================================
// 2. YOUTUBE EXTRACTOR (Direct Server-Side Cloud Conversion & Streams)
// ==========================================
async function extractYouTube(url: string): Promise<MediaMetadata> {
  const ytId = extractYouTubeId(url);
  if (!ytId) {
    throw new Error('Invalid YouTube URL. Please provide a valid YouTube Shorts, Video, or Music link.');
  }

  let isUnavailable = false;
  let oEmbedMeta: { title?: string; author?: string; thumbnail?: string } | null = null;

  // 1. Fast YouTube oEmbed metadata resolution
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

  // 2. Fetch YouTube watch page for exact player stream data and real sizes
  let finalTitle = oEmbedMeta?.title || 'YouTube Song / Video';
  let finalAuthor = oEmbedMeta?.author || 'YouTube Artist';
  let finalThumb = oEmbedMeta?.thumbnail || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  let durationSec = 240;
  let playerResponse: any = null;

  try {
    const pageRes = await fetchWithTimeout(
      `https://www.youtube.com/watch?v=${ytId}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
      3500
    );
    if (pageRes.ok) {
      const html = await pageRes.text();
      const match = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?});(?:var|<\/script)/);
      if (match) {
        try {
          playerResponse = JSON.parse(match[1]);
        } catch (_) {}
      }
      if (playerResponse?.videoDetails) {
        finalTitle = playerResponse.videoDetails.title || finalTitle;
        finalAuthor = playerResponse.videoDetails.author || finalAuthor;
        durationSec = Number(playerResponse.videoDetails.lengthSeconds) || durationSec;
      }
    }
  } catch (_) {}

  const adaptiveFormats: any[] = playerResponse?.streamingData?.adaptiveFormats || [];
  const audioStream =
    adaptiveFormats.find((f: any) => f.mimeType?.startsWith('audio/mp4')) ||
    adaptiveFormats.find((f: any) => f.mimeType?.startsWith('audio/'));
  const audioBytes = Number(audioStream?.contentLength || (durationSec * 128 * 1000) / 8);

  const getFormatSize = (targetRes: string, fallbackKbps: number): string => {
    let vStream = adaptiveFormats.find(
      (f: any) => f.qualityLabel?.includes(targetRes) && f.mimeType?.includes('video/mp4') && f.contentLength
    );
    if (!vStream) {
      vStream = adaptiveFormats.find((f: any) => f.qualityLabel?.includes(targetRes) && f.contentLength);
    }
    if (vStream && vStream.contentLength) {
      const totalBytes = Number(vStream.contentLength) + audioBytes;
      const mb = totalBytes / 1024 / 1024;
      return mb >= 1000 ? `${(mb / 1024).toFixed(1)}GB` : `${Math.round(mb)}MB`;
    }
    const mb = (durationSec * fallbackKbps * 1000) / 8 / (1024 * 1024);
    return `${Math.round(mb)}MB`;
  };

  const getAudioSize = (kbps: number): string => {
    const mb = (durationSec * kbps * 1000) / 8 / (1024 * 1024);
    return `${Math.round(mb * 10) / 10}MB`;
  };

  const has4K = adaptiveFormats.length === 0 || adaptiveFormats.some((f: any) => f.qualityLabel?.includes('2160'));
  const has2K = adaptiveFormats.length === 0 || adaptiveFormats.some((f: any) => f.qualityLabel?.includes('1440'));

  const qualityOptions: QualityOption[] = [];

  if (has4K) {
    qualityOptions.push({
      label: `Ultra HD 4K (2160p ~${getFormatSize('2160', 4800)})`,
      url: `loader:4k:${ytId}`,
      type: 'video',
      quality: '4K 2160p Ultra HD',
    });
  }

  if (has2K) {
    qualityOptions.push({
      label: `Quad HD 2K (1440p ~${getFormatSize('1440', 2500)})`,
      url: `loader:1440:${ytId}`,
      type: 'video',
      quality: '2K 1440p QHD',
    });
  }

  qualityOptions.push(
    {
      label: `Full HD 1080p (~${getFormatSize('1080', 1800)})`,
      url: `loader:1080:${ytId}`,
      type: 'video',
      quality: '1080p Full HD',
    },
    {
      label: `HD Video 720p (~${getFormatSize('720', 850)})`,
      url: `loader:720:${ytId}`,
      type: 'video',
      quality: '720p HD',
    },
    {
      label: `Standard 480p (~${getFormatSize('480', 450)})`,
      url: `loader:480:${ytId}`,
      type: 'video',
      quality: '480p SD',
    },
    {
      label: `Light 360p (~${getFormatSize('360', 250)})`,
      url: `loader:360:${ytId}`,
      type: 'video',
      quality: '360p SD',
    },
    {
      label: `Song / MP3 (HQ 320k ~${getAudioSize(320)})`,
      url: `loader:mp3:${ytId}`,
      type: 'audio',
      quality: 'HQ Audio 320kbps',
    },
    {
      label: `Standard MP3 (128k ~${getAudioSize(128)})`,
      url: `loader:128:${ytId}`,
      type: 'audio',
      quality: '128kbps',
    }
  );

  return {
    id: ytId,
    platform: 'youtube',
    title: finalTitle,
    author: finalAuthor,
    thumbnail: finalThumb,
    duration: durationSec,
    videoUrl: `loader:720:${ytId}`,
    audioUrl: `loader:mp3:${ytId}`,
    originalUrl: url,
    qualityOptions,
  };
}

// ==========================================
// 3. INSTAGRAM EXTRACTOR (Direct SnapSave Algorithm)
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

function decodeSnapApp(args: string[]): string {
  const [h, u, n, t, e, r] = args;
  const tNum = Number(t);
  const eNum = Number(e);

  function decode(d: string, eVal: number, fVal: number): string {
    const g = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'.split('');
    const hArr = g.slice(0, eVal);
    const iArr = g.slice(0, fVal);
    let j = d.split('').reverse().reduce((a, b, c) => {
      const idx = hArr.indexOf(b);
      if (idx !== -1) return a + idx * Math.pow(eVal, c);
      return a;
    }, 0);
    let k = '';
    while (j > 0) {
      k = iArr[j % fVal] + k;
      j = Math.floor(j / fVal);
    }
    return k || '0';
  }

  let result = '';
  for (let i = 0, len = h.length; i < len;) {
    let s = '';
    while (i < len && h[i] !== n[eNum]) {
      s += h[i];
      i++;
    }
    i++;
    for (let j = 0; j < n.length; j++) {
      s = s.replace(new RegExp(n[j], 'g'), j.toString());
    }
    result += String.fromCharCode(Number(decode(s, eNum, 10)) - tNum);
  }

  try {
    const bytes = new Uint8Array(result.split('').map((char) => char.charCodeAt(0)));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return result;
  }
}

function getEncodedSnapApp(data: string): string[] {
  const parts = data.split('decodeURIComponent(escape(r))}(');
  if (!parts[1]) throw new Error('SnapSave: Unexpected payload format');
  const sub = parts[1].split('))')[0];
  return sub.split(',').map((v) => v.replace(/"/g, '').trim());
}

function getDecodedSnapSave(data: string): string {
  const alertMatch = data?.match(/document\.querySelector\("#alert"\)\.innerHTML\s*=\s*"([^"]+)"/);
  if (alertMatch && alertMatch[1]) {
    throw new Error(alertMatch[1]);
  }
  const part = data.split('getElementById("download-section").innerHTML = "')[1];
  if (!part) throw new Error('SnapSave: download-section not found');
  return part.split('"; document.getElementById("inputData").remove(); ')[0].replace(/\\(\\)?/g, '');
}

export async function extractInstagramViaSnapSave(url: string): Promise<MediaMetadata> {
  const clean = cleanInputUrl(url).replace(/\?.*$/, '');
  const shortcode = extractInstagramShortcode(clean) || `ig_${Date.now()}`;
  const formData = new URLSearchParams();
  formData.append('url', clean);

  const res = await fetchWithTimeout(
    'https://snapsave.app/action.php?lang=en',
    {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://snapsave.app',
        'referer': 'https://snapsave.app/',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      body: formData.toString(),
    },
    25000
  );

  if (!res.ok) {
    throw new Error(`SnapSave service returned HTTP ${res.status}`);
  }

  const rawText = await res.text();
  const decodedHtml = getDecodedSnapSave(decodeSnapApp(getEncodedSnapApp(rawText)));

  // Extract all download links
  const hrefMatches = [...decodedHtml.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => u.startsWith('http') && !u.includes('play.google.com') && !u.includes('instagram.com'));

  if (hrefMatches.length === 0) {
    throw new Error('No download links found in SnapSave output.');
  }

  // Extract thumbnail
  const imgMatch = decodedHtml.match(/<img[^>]+src="([^"]+)"/i);
  const thumbnail = imgMatch ? imgMatch[1] : '';

  // Extract title / description
  const titleMatch = decodedHtml.match(/class="video-des"[^>]*>([^<]+)<\/span>/i);
  const title = titleMatch ? titleMatch[1].trim() : `Instagram Reel (${shortcode})`;

  const primaryVideoUrl = cleanInstagramMediaUrl(hrefMatches[0]);

  return {
    id: shortcode,
    platform: 'instagram',
    title: title || 'Instagram Video (HD)',
    author: 'Instagram Creator',
    thumbnail,
    videoUrl: primaryVideoUrl,
    originalUrl: url,
    qualityOptions: [
      {
        label: 'HD Video (No Watermark)',
        url: primaryVideoUrl,
        type: 'video',
        quality: '1080p HD',
      },
      ...(hrefMatches.length > 1
        ? [
            {
              label: 'Standard Quality',
              url: cleanInstagramMediaUrl(hrefMatches[1]),
              type: 'video' as const,
              quality: '720p SD',
            },
          ]
        : []),
    ],
  };
}

async function extractInstagram(url: string): Promise<MediaMetadata> {
  // Tier 1: Pure HTTP direct extraction via SnapSave (Instant download outside browser)
  try {
    return await extractInstagramViaSnapSave(url);
  } catch (err: any) {
    console.warn('SnapSave extraction failed, trying embed fallback...', err?.message);
  }

  // Tier 2: Embed captioned fallback
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
        5000
      );
      if (res.ok) {
        const html = await res.text();
        const mp4Matches = html.match(/https:\/\/[^"'\s\\]+?\.mp4[^"'\s\\]*/g);
        if (mp4Matches && mp4Matches.length > 0) {
          const directVideoUrl = cleanInstagramMediaUrl(mp4Matches[0]);
          return {
            id: shortcode,
            platform: 'instagram',
            title: 'Instagram Video (HD)',
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
      // Fallback
    }
  }

  throw new InstagramRequiresBrowserError(
    'Instagram video could not be resolved automatically (it may be age-restricted or from a private account). Would you like to view it in the built-in browser?',
    url
  );
}

// ==========================================
// UNIFIED EXTRACTOR
// ==========================================
export async function extractMedia(url: string): Promise<MediaMetadata> {
  const trimmed = cleanInputUrl(url);
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
