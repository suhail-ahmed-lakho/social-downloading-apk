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
  if (
    cleanUrl.includes('pinterest.') ||
    cleanUrl.includes('pin.it') ||
    cleanUrl.includes('pinimg.com')
  ) {
    return 'pinterest';
  }
  return 'unknown';
}

// Extract Pinterest Pin ID (supports /pin/<id>/, /pin/<id>, and regional domains)
export function extractPinterestPinId(url: string): string | null {
  const clean = cleanInputUrl(url);
  const match = clean.match(/(?:pinterest\.[a-z.]+|pinimg\.com)\/pin\/(\d+)/i);
  return match ? match[1] : null;
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

  const formatMetricLabel = (bytes: number): string => {
    const mb = bytes / 1024 / 1024;
    return mb >= 1000 ? `${(mb / 1024).toFixed(1)}GB` : `${Math.max(1, Math.round(mb))}MB`;
  };

  const getFormatMetrics = (targetRes: string, fallbackKbps: number): { label: string; bytes: number } => {
    let vStream = adaptiveFormats.find(
      (f: any) => f.qualityLabel?.includes(targetRes) && f.mimeType?.includes('video/mp4') && f.contentLength
    );
    if (!vStream) {
      vStream = adaptiveFormats.find((f: any) => f.qualityLabel?.includes(targetRes) && f.contentLength);
    }
    let totalBytes: number;
    if (vStream && vStream.contentLength) {
      totalBytes = Number(vStream.contentLength) + audioBytes;
    } else {
      totalBytes = Math.round((durationSec * fallbackKbps * 1000) / 8);
    }
    return { label: formatMetricLabel(totalBytes), bytes: totalBytes };
  };

  const getAudioMetrics = (kbps: number, preferStreamBytes = false): { label: string; bytes: number } => {
    const fallbackBytes = Math.round((durationSec * kbps * 1000) / 8);
    const bytes = preferStreamBytes && audioStream?.contentLength ? Number(audioStream.contentLength) : fallbackBytes;
    const mb = bytes / 1024 / 1024;
    return { label: `${Math.max(0.1, Math.round(mb * 10) / 10)}MB`, bytes };
  };

  const has4K = adaptiveFormats.length === 0 || adaptiveFormats.some((f: any) => f.qualityLabel?.includes('2160'));
  const has2K = adaptiveFormats.length === 0 || adaptiveFormats.some((f: any) => f.qualityLabel?.includes('1440'));

  const m1080 = getFormatMetrics('1080', 1800);
  const m720 = getFormatMetrics('720', 850);
  const m480 = getFormatMetrics('480', 450);
  const m360 = getFormatMetrics('360', 250);
  const m2k = getFormatMetrics('1440', 2500);
  const m4k = getFormatMetrics('2160', 4800);
  const mM4a = getAudioMetrics(128, true);
  const mMp3Hq = getAudioMetrics(320, false);
  const mMp3Std = getAudioMetrics(128, false);

  // Order compatible H.264 presets (1080p/720p) first so default playback works on all phones;
  // AV1 high-res options (2K/4K) remain available below clearly labeled.
  const qualityOptions: QualityOption[] = [
    {
      label: `Full HD 1080p (~${m1080.label})`,
      url: `loader:1080:${ytId}`,
      type: 'video',
      quality: '1080p Full HD',
      estimatedBytes: m1080.bytes,
      fileExtension: '.mp4',
    },
    {
      label: `HD Video 720p (~${m720.label})`,
      url: `loader:720:${ytId}`,
      type: 'video',
      quality: '720p HD',
      estimatedBytes: m720.bytes,
      fileExtension: '.mp4',
    },
    {
      label: `Standard 480p (~${m480.label})`,
      url: `loader:480:${ytId}`,
      type: 'video',
      quality: '480p SD',
      estimatedBytes: m480.bytes,
      fileExtension: '.mp4',
    },
    {
      label: `Fast 360p MP4 (~${m360.label})`,
      url: `loader:360:${ytId}`,
      type: 'video',
      quality: '360p Fast',
      estimatedBytes: m360.bytes,
      fileExtension: '.mp4',
    },
  ];

  if (has2K) {
    qualityOptions.push({
      label: `Quad HD 2K AV1 (~${m2k.label})`,
      url: `loader:1440:${ytId}`,
      type: 'video',
      quality: '2K 1440p (AV1)',
      estimatedBytes: m2k.bytes,
      fileExtension: '.mp4',
    });
  }

  if (has4K) {
    qualityOptions.push({
      label: `Ultra HD 4K AV1 (~${m4k.label})`,
      url: `loader:4k:${ytId}`,
      type: 'video',
      quality: '4K 2160p (AV1)',
      estimatedBytes: m4k.bytes,
      fileExtension: '.mp4',
    });
  }

  qualityOptions.push(
    {
      label: `Best Song Audio • M4A (~${mM4a.label})`,
      url: `loader:m4a:${ytId}`,
      type: 'audio',
      quality: 'M4A HD Audio',
      estimatedBytes: mM4a.bytes,
      fileExtension: '.m4a',
    },
    {
      label: `Song / MP3 (HQ 320k ~${mMp3Hq.label})`,
      url: `loader:mp3:${ytId}`,
      type: 'audio',
      quality: 'MP3 320kbps',
      estimatedBytes: mMp3Hq.bytes,
      fileExtension: '.mp3',
    },
    {
      label: `Standard MP3 (128k ~${mMp3Std.label})`,
      url: `loader:128:${ytId}`,
      type: 'audio',
      quality: 'MP3 128kbps',
      estimatedBytes: mMp3Std.bytes,
      fileExtension: '.mp3',
    }
  );

  return {
    id: ytId,
    platform: 'youtube',
    title: finalTitle,
    author: finalAuthor,
    thumbnail: finalThumb,
    duration: durationSec,
    videoUrl: `loader:1080:${ytId}`,
    audioUrl: `loader:m4a:${ytId}`,
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
    8000
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
    const endpoints = [
      `https://www.instagram.com/reel/${shortcode}/embed/captioned/`,
      `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
    ];
    for (const endpoint of endpoints) {
      try {
        const res = await fetchWithTimeout(
          endpoint,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          },
          4500
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
          const imgMatches = html.match(/https:\/\/[^"'\s\\]+?cdninstagram\.com\/[^"'\s\\]+?\.(?:jpg|webp|jpeg)[^"'\s\\]*/g);
          if (imgMatches && imgMatches.length > 0) {
            const directImgUrl = cleanInstagramMediaUrl(imgMatches[0]);
            return {
              id: shortcode,
              platform: 'instagram',
              title: 'Instagram Photo (HD)',
              author: 'Instagram Creator',
              thumbnail: directImgUrl,
              videoUrl: directImgUrl,
              originalUrl: url,
              qualityOptions: [
                {
                  label: 'HD Photo',
                  url: directImgUrl,
                  type: 'image',
                  quality: 'Original HD',
                  fileExtension: '.jpg',
                },
              ],
            };
          }
        }
      } catch {
        // Continue to next endpoint
      }
    }
  }

  throw new InstagramRequiresBrowserError(
    'Instagram video could not be resolved automatically (it may be age-restricted or from a private account). Would you like to view it in the built-in browser?',
    url
  );
}

// ==========================================
// 4. PINTEREST EXTRACTOR (Videos & Photos)
// ==========================================
export async function extractPinterest(url: string): Promise<MediaMetadata> {
  const cleanUrl = cleanInputUrl(url);

  const fetchHeaders = [
    {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    {
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  ];

  let html = '';
  let finalUrl = cleanUrl;
  let lastError: Error | null = null;

  for (const headers of fetchHeaders) {
    try {
      const res = await fetchWithTimeout(
        cleanUrl,
        {
          headers,
          redirect: 'follow',
        },
        7000
      );
      if (res.ok) {
        html = await res.text();
        finalUrl = res.url || cleanUrl;
        break;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!html) {
    throw new Error(
      lastError?.message ||
        'Unable to load Pinterest page. Please check your internet connection or URL.'
    );
  }

  // 1. Extract Pin ID
  const pinIdMatch =
    finalUrl.match(/\/pin\/(\d+)/i) ||
    cleanUrl.match(/\/pin\/(\d+)/i) ||
    html.match(/pin\/(\d+)/i);
  const pinId = pinIdMatch ? pinIdMatch[1] : `pin_${Date.now()}`;

  // 2. Extract Title
  const ogTitleMatch =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i) ||
    html.match(/<title>([^<]*)<\/title>/i);
  let title = ogTitleMatch ? ogTitleMatch[1].trim() : 'Pinterest Media';
  title = title
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s*\|\s*Pinterest.*$/i, '')
    .trim();

  // 3. Extract Author
  const authorMatch =
    html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+property=["']og:article:author["'][^>]+content=["']([^"']+)["']/i);
  const author = authorMatch ? authorMatch[1].trim() : 'Pinterest Creator';

  // 4. Extract Thumbnail / Cover Image
  const ogImageMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  let thumbnail = ogImageMatch ? ogImageMatch[1].trim() : '';

  // 5. Extract Direct MP4 Video URLs
  const rawMp4Matches = html.match(/https?:\/\/[^"'<>\s]+\.mp4[^"'<>\s]*/gi) || [];
  const validMp4s = [
    ...new Set(
      rawMp4Matches
        .map((u) => u.replace(/\\/g, ''))
        .filter((u) => u.includes('pinimg.com') || u.includes('pinterest.com'))
    ),
  ];

  // 6. Extract M3U8 Playlists and convert to 720p MP4 if no direct MP4 found
  const rawM3u8Matches = html.match(/https?:\/\/[^"'<>\s]+\.m3u8[^"'<>\s]*/gi) || [];
  const validM3u8s = [
    ...new Set(rawM3u8Matches.map((u) => u.replace(/\\/g, ''))),
  ];

  if (validMp4s.length === 0 && validM3u8s.length > 0) {
    for (const m3u8 of validM3u8s) {
      const converted = m3u8
        .replace(/\/videos\/(?:iht\/)?hls\//i, '/videos/mc/720p/')
        .replace(/\.m3u8.*$/i, '.mp4');
      if (converted !== m3u8 && !validMp4s.includes(converted)) {
        validMp4s.push(converted);
      }
    }
  }

  // 7. Derive Highest-Resolution Image (originals)
  let originalImage = '';
  if (thumbnail) {
    originalImage = thumbnail.replace(/\/(?:236x|474x|564x|736x)\//, '/originals/');
  }

  const isVideo = validMp4s.length > 0;
  const qualityOptions: QualityOption[] = [];

  if (isVideo) {
    const primaryVideo = validMp4s[0];

    // Check if a 1080p Full HD stream is available on Pinterest CDN
    let hd1080Url = '';
    if (primaryVideo.includes('/mc/720p/')) {
      const candidate1080 = primaryVideo.replace('/mc/720p/', '/mc/1080p/');
      try {
        const head1080 = await fetchWithTimeout(candidate1080, { method: 'HEAD' }, 2000);
        if (head1080.ok) {
          hd1080Url = candidate1080;
        }
      } catch {}
    }

    if (hd1080Url) {
      qualityOptions.push({
        label: 'Full HD Video (1080p MP4)',
        url: hd1080Url,
        type: 'video',
        quality: '1080p Full HD',
        fileExtension: '.mp4',
      });
    }

    qualityOptions.push({
      label: 'HD Video (720p MP4)',
      url: primaryVideo,
      type: 'video',
      quality: '720p HD',
      fileExtension: '.mp4',
    });

    if (originalImage) {
      qualityOptions.push({
        label: 'Cover Thumbnail (HD)',
        url: originalImage,
        type: 'video',
        quality: 'Original Image',
        fileExtension: originalImage.endsWith('.png') ? '.png' : '.jpg',
      });
    }
  } else if (originalImage) {
    const ext = originalImage.endsWith('.png') ? '.png' : '.jpg';
    qualityOptions.push({
      label: 'Original Master Photo (4K / 2K / HD)',
      url: originalImage,
      type: 'video',
      quality: 'Original Master (4K/2K/HD)',
      fileExtension: ext,
    });

    if (thumbnail && thumbnail !== originalImage) {
      qualityOptions.push({
        label: 'Standard Preview Photo',
        url: thumbnail,
        type: 'video',
        quality: '736x Preview',
        fileExtension: ext,
      });
    }
  }

  if (qualityOptions.length === 0) {
    throw new Error('No downloadable media (video or photo) found on this Pinterest pin.');
  }

  return {
    id: pinId,
    platform: 'pinterest',
    title: title || 'Pinterest Pin',
    author,
    thumbnail: thumbnail || originalImage || qualityOptions[0]?.url || '',
    videoUrl: qualityOptions[0]?.url || '',
    originalUrl: url,
    qualityOptions,
  };
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
    case 'pinterest':
      return await extractPinterest(trimmed);
    default:
      // Try YouTube fallback if URL has watch or youtu.be
      if (trimmed.includes('youtu')) {
        return await extractYouTube(trimmed);
      }
      throw new Error('Unsupported link. Please paste a link from TikTok, Instagram, YouTube, or Pinterest.');
  }
}
