// Service to resolve YouTube media download streams via fast cloud conversion

export type YouTubeTargetFormat = '4k' | '2160' | '1440' | '1080' | '720' | '480' | '360' | 'mp3' | '128';

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

export async function resolveYouTubeDownloadUrl(
  youtubeUrlOrId: string,
  format: string = 'mp3',
  onProgress?: (percent: number, status: string) => void
): Promise<string> {
  const clean = youtubeUrlOrId.trim();
  const fullUrl = clean.startsWith('http')
    ? clean
    : `https://www.youtube.com/watch?v=${clean}`;

  // Map format to supported loader.to targets
  let targetFormat = 'mp3';
  if (format === '4k' || format === '2160') {
    targetFormat = '4k';
  } else if (format === '1440' || format === '1080' || format === '720' || format === '480' || format === '360') {
    targetFormat = format;
  } else if (format === 'mp3' || format === '128' || format === 'audio') {
    targetFormat = 'mp3';
  }

  const endpoint = `https://loader.to/ajax/download.php?format=${targetFormat}&url=${encodeURIComponent(fullUrl)}`;

  if (onProgress) {
    onProgress(0.05, targetFormat === 'mp3' ? 'Connecting to YouTube Music converter...' : 'Preparing HD video stream...');
  }

  const controller = new AbortController();
  const initTimeout = setTimeout(() => controller.abort(), 12000);

  let initData: LoaderInitResponse;
  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
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

  if (!initData || !initData.progress_url) {
    throw new Error('Unable to start YouTube conversion. Please verify the link is active.');
  }

  const progressUrl = initData.progress_url;
  const maxPolls = 35; // ~40-45 seconds max
  let lastPercent = 5;

  for (let poll = 0; poll < maxPolls; poll++) {
    await new Promise((r) => setTimeout(r, 1200));

    try {
      const pollRes = await fetch(progressUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      });

      if (pollRes.ok) {
        const pollData: LoaderProgressResponse = await pollRes.json();

        // Check if finished
        if (pollData.download_url && pollData.download_url.startsWith('http')) {
          if (onProgress) {
            onProgress(1, 'Conversion complete! Downloading file...');
          }
          return pollData.download_url;
        }

        // Calculate progress percentage
        if (typeof pollData.progress === 'number' && pollData.progress > 0) {
          const rawPct = Math.round(pollData.progress / 10); // 0 to 100
          lastPercent = Math.max(lastPercent, rawPct);
          if (onProgress) {
            const statusLabel =
              targetFormat === 'mp3'
                ? `Converting YouTube audio to MP3 (${lastPercent}%)...`
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
    } catch (_) {
      // Continue polling on transient network hiccup
    }
  }

  throw new Error('YouTube conversion timed out. Please try again or test another resolution.');
}
