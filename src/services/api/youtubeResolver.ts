// Service to resolve YouTube media download streams via direct InnerTube or fast cloud conversion

export type YouTubeTargetFormat =
  | '4k'
  | '2160'
  | '1440'
  | '1080'
  | '720'
  | '480'
  | '360'
  | 'm4a'
  | 'mp3'
  | '128';

interface LoaderInitResponse {
  success: boolean;
  id?: string;
  progress_url?: string;
  title?: string;
  message?: string;
}

interface LoaderProgressResponse {
  success: number;
  progress: number; // 0 to 1000
  download_url?: string;
  text?: string;
  title?: string;
}

function extractYouTubeVideoId(input: string): string | null {
  const clean = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }
  const match = clean.match(/(?:v=|\/shorts\/|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/**
 * Fetches a direct Google CDN muxed MP4 stream (itag 18, 360p H.264 + AAC) via the
 * Android InnerTube API. Direct streams carry exact Content-Length headers and
 * byte-range support, avoiding chunked converter bottlenecks when 360p is selected.
 */
async function tryDirectAndroidMuxedStream(videoId: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip',
        'X-YouTube-Client-Name': '3',
        'X-YouTube-Client-Version': '20.10.38',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '20.10.38',
            androidSdkVersion: 30,
            hl: 'en',
            gl: 'US',
          },
        },
        videoId,
      }),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (data?.playabilityStatus?.status !== 'OK') return null;

    const formats: any[] = data?.streamingData?.formats || [];
    const muxed360 =
      formats.find((f) => f.itag === 18 && typeof f.url === 'string' && f.url.startsWith('http')) ||
      formats.find(
        (f) =>
          typeof f.url === 'string' &&
          f.url.startsWith('http') &&
          String(f.mimeType || '').includes('video/mp4')
      );
    return muxed360?.url || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveYouTubeDownloadUrl(
  youtubeUrlOrId: string,
  format: string = 'm4a',
  onProgress?: (percent: number, status: string) => void
): Promise<string> {
  const clean = youtubeUrlOrId.trim();
  const videoId = extractYouTubeVideoId(clean);
  const fullUrl = clean.startsWith('http')
    ? clean
    : `https://www.youtube.com/watch?v=${clean}`;

  // Map format to supported targets (m4a avoids converter double-ID3 corruption on Android)
  let targetFormat = 'm4a';
  if (format === '4k' || format === '2160') {
    targetFormat = '4k';
  } else if (format === '1440' || format === '1080' || format === '720' || format === '480' || format === '360') {
    targetFormat = format;
  } else if (format === 'm4a') {
    targetFormat = 'm4a';
  } else if (format === 'mp3' || format === '128' || format === 'audio') {
    targetFormat = 'mp3';
  }

  const isAudioTarget = targetFormat === 'mp3' || targetFormat === 'm4a';

  if (targetFormat === '360' && videoId) {
    if (onProgress) {
      onProgress(0.15, 'Connecting directly to fast YouTube MP4 CDN...');
    }
    const directUrl = await tryDirectAndroidMuxedStream(videoId);
    if (directUrl) {
      if (onProgress) {
        onProgress(1, 'Direct stream ready! Starting fast download...');
      }
      return directUrl;
    }
  }

  const endpoint = `https://loader.to/ajax/download.php?format=${targetFormat}&url=${encodeURIComponent(fullUrl)}`;

  if (onProgress) {
    onProgress(
      0.05,
      targetFormat === 'm4a'
        ? 'Preparing HD M4A song stream...'
        : targetFormat === 'mp3'
        ? 'Connecting to YouTube Music converter...'
        : 'Preparing HD video stream...'
    );
  }

  const controller = new AbortController();
  const initTimeout = setTimeout(() => controller.abort(), 14000);

  let initData: LoaderInitResponse;
  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://loader.to/en108/1080p-video-downloader.html',
        Origin: 'https://loader.to',
      },
    });
    clearTimeout(initTimeout);

    if (!res.ok) {
      throw new Error(`Converter returned status ${res.status}`);
    }
    initData = await res.json();
  } catch (err: any) {
    clearTimeout(initTimeout);
    throw new Error(
      `Could not initialize YouTube conversion (${err?.message || 'Server busy'}). Please try again.`
    );
  }

  if (!initData || initData.success === false || !initData.progress_url) {
    throw new Error(initData?.message || 'Unable to start YouTube conversion. Please verify the link is active.');
  }

  const progressUrl = initData.progress_url;
  const maxPolls = targetFormat === '4k' || targetFormat === '1440' ? 70 : 50;
  let lastPercent = 5;

  for (let poll = 0; poll < maxPolls; poll++) {
    await new Promise((r) => setTimeout(r, 1200));

    const pollController = new AbortController();
    const pollTimeout = setTimeout(() => pollController.abort(), 8000);
    try {
      const pollRes = await fetch(progressUrl, {
        signal: pollController.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json',
          Referer: 'https://loader.to/',
          Origin: 'https://loader.to',
        },
      });
      clearTimeout(pollTimeout);

      if (pollRes.ok) {
        const pollData: LoaderProgressResponse = await pollRes.json();

        // Check if finished
        if (pollData.download_url && pollData.download_url.startsWith('http')) {
          if (onProgress) {
            onProgress(1, 'Conversion complete! Downloading file...');
          }
          return pollData.download_url;
        }

        if (pollData.text && (pollData.text.toLowerCase().includes('error') || pollData.text.toLowerCase().includes('failed'))) {
          throw new Error(`Conversion error: ${pollData.text}`);
        }

        // Calculate progress percentage
        if (typeof pollData.progress === 'number' && pollData.progress > 0) {
          const rawPct = Math.round(pollData.progress / 10); // 0 to 100
          lastPercent = Math.max(lastPercent, rawPct);
          if (onProgress) {
            const statusLabel =
              isAudioTarget
                ? `Converting YouTube song to ${targetFormat.toUpperCase()} (${lastPercent}%)...`
                : `Processing HD video stream (${lastPercent}%)...`;
            onProgress(lastPercent / 100, statusLabel);
          }
        } else if (onProgress) {
          onProgress(
            Math.min(0.9, lastPercent / 100 + 0.05),
            pollData.text || 'Preparing media stream...'
          );
        }
      }
    } catch (err: any) {
      clearTimeout(pollTimeout);
      if (err?.message?.startsWith('Conversion error:')) {
        throw err;
      }
      // Continue polling on transient network hiccup
    }
  }

  throw new Error('YouTube conversion timed out. Please try 1080p/720p or M4A audio.');
}
