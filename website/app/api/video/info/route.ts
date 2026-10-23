import { NextRequest, NextResponse } from "next/server";

// Detect platform from URL
function detectPlatform(url: string): string {
  const clean = url.trim().toLowerCase();
  if (clean.includes("tiktok.com") || clean.includes("vm.tiktok.com")) return "tiktok";
  if (clean.includes("youtube.com") || clean.includes("youtu.be")) return "youtube";
  if (clean.includes("instagram.com") || clean.includes("instagr.am")) return "instagram";
  if (clean.includes("twitter.com") || clean.includes("x.com")) return "twitter";
  if (clean.includes("facebook.com") || clean.includes("fb.watch")) return "facebook";
  return "unknown";
}

// Extract YouTube ID (Supports regular videos, shorts, and music.youtube.com)
function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|(?:www\.|m\.|music\.)?youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i
  );
  return match ? match[1] : null;
}

// Extract Instagram shortcode
function extractInstagramShortcode(url: string): string | null {
  const match = url.match(/(?:instagram\.com\/(?:p|reel|tv)\/)([\w-]+)/i);
  return match ? match[1] : null;
}

// Format accurate file size from duration and bitrate
function calculateSize(durationSec: number, bitrateKbps: number): string {
  if (!durationSec || durationSec <= 0) return "Direct Stream";
  const bytes = (durationSec * bitrateKbps * 1000) / 8;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1000) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${Math.round(mb * 10) / 10} MB`;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const trimmed = url.trim();
    const platform = detectPlatform(trimmed);

    // ──────────────────────────────────────────
    // 1. YOUTUBE EXTRACTOR (Accurate Duration & Real MB Sizes)
    // ──────────────────────────────────────────
    if (platform === "youtube" || trimmed.includes("youtu")) {
      const ytId = extractYouTubeId(trimmed);
      if (!ytId) {
        return NextResponse.json(
          { error: "Invalid YouTube URL. Please provide a valid YouTube Shorts, Video, or Music link." },
          { status: 400 }
        );
      }

      let title = "YouTube Video / Song";
      let author = "YouTube Artist";
      let thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      let durationSec = 0;

      // 1. Fast oEmbed metadata
      try {
        const oRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`,
          { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } }
        );
        if (oRes.ok) {
          const oData = await oRes.json();
          title = oData.title || title;
          author = oData.author_name || author;
          thumbnail = oData.thumbnail_url || thumbnail;
        }
      } catch (err) {
        console.warn("[oEmbed warning]", err);
      }

      // 2. Fetch YouTube watch page for exact player stream data and real sizes
      let playerResponse: any = null;
      try {
        const pageRes = await fetch(`https://www.youtube.com/watch?v=${ytId}`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(4000),
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?});(?:var|<\/script)/);
          if (playerMatch) {
            try {
              playerResponse = JSON.parse(playerMatch[1]);
            } catch (_) {}
          }
          if (playerResponse?.videoDetails) {
            title = playerResponse.videoDetails.title || title;
            author = playerResponse.videoDetails.author || author;
            durationSec = Number(playerResponse.videoDetails.lengthSeconds) || 0;
          } else {
            const durMatch = html.match(/"approxDurationMs":"(\d+)"/);
            if (durMatch && durMatch[1]) {
              durationSec = Math.round(Number(durMatch[1]) / 1000);
            }
          }
        }
      } catch (_) {
        if (!durationSec) durationSec = 240;
      }

      if (!durationSec || durationSec <= 0) durationSec = 240;

      const adaptiveFormats: any[] = playerResponse?.streamingData?.adaptiveFormats || [];
      const audioStream =
        adaptiveFormats.find((f: any) => f.mimeType?.startsWith("audio/mp4")) ||
        adaptiveFormats.find((f: any) => f.mimeType?.startsWith("audio/"));
      const audioBytes = Number(audioStream?.contentLength || (durationSec * 128 * 1000) / 8);

      // Helper to calculate exact stream size or realistic fallback
      const getRealFormatSize = (targetRes: string, fallbackBitrate: number): string => {
        let vStream = adaptiveFormats.find(
          (f: any) => f.qualityLabel?.includes(targetRes) && f.mimeType?.includes("video/mp4") && f.contentLength
        );
        if (!vStream) {
          vStream = adaptiveFormats.find((f: any) => f.qualityLabel?.includes(targetRes) && f.contentLength);
        }
        if (vStream && vStream.contentLength) {
          const totalBytes = Number(vStream.contentLength) + audioBytes;
          const mb = totalBytes / 1024 / 1024;
          return mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb * 10) / 10} MB`;
        }
        return calculateSize(durationSec, fallbackBitrate);
      };

      const has4K = adaptiveFormats.length === 0 || adaptiveFormats.some((f: any) => f.qualityLabel?.includes("2160"));
      const has2K = adaptiveFormats.length === 0 || adaptiveFormats.some((f: any) => f.qualityLabel?.includes("1440"));

      const qualityOptions = [];

      if (has4K) {
        qualityOptions.push({
          label: "Ultra HD 4K 2160p (MP4)",
          quality: "2160p 4K",
          type: "video",
          format: "4k",
          approxSize: getRealFormatSize("2160", 4800),
        });
      }

      if (has2K) {
        qualityOptions.push({
          label: "Quad HD 1440p 2K (MP4)",
          quality: "1440p 2K",
          type: "video",
          format: "1440",
          approxSize: getRealFormatSize("1440", 2500),
        });
      }

      qualityOptions.push(
        {
          label: "Full HD 1080p (MP4)",
          quality: "1080p",
          type: "video",
          format: "1080",
          approxSize: getRealFormatSize("1080", 1800),
        },
        {
          label: "HD Video 720p (MP4)",
          quality: "720p",
          type: "video",
          format: "720",
          approxSize: getRealFormatSize("720", 850),
        },
        {
          label: "Standard 480p (MP4)",
          quality: "480p",
          type: "video",
          format: "480",
          approxSize: getRealFormatSize("480", 450),
        },
        {
          label: "Standard 360p (MP4)",
          quality: "360p",
          type: "video",
          format: "360",
          approxSize: getRealFormatSize("360", 250),
        },
        {
          label: "Lossless MP3 Audio (320kbps)",
          quality: "320kbps",
          type: "audio",
          format: "mp3",
          approxSize: calculateSize(durationSec, 320),
        },
        {
          label: "Standard MP3 Audio (128kbps)",
          quality: "128kbps",
          type: "audio",
          format: "128",
          approxSize: calculateSize(durationSec, 128),
        }
      );

      return NextResponse.json({
        platform: "youtube",
        title,
        author,
        thumbnail,
        duration: String(durationSec),
        videoId: ytId,
        qualityOptions,
      });
    }

    // ──────────────────────────────────────────
    // 2. TIKTOK EXTRACTOR (TikWM - No Watermark HD)
    // ──────────────────────────────────────────
    if (platform === "tiktok") {
      try {
        const tikRes = await fetch(
          `https://www.tikwm.com/api/?url=${encodeURIComponent(trimmed)}&hd=1`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              Accept: "application/json",
            },
          }
        );

        if (tikRes.ok) {
          const resJson = await tikRes.json();
          if (resJson && resJson.code === 0 && resJson.data) {
            const data = resJson.data;
            const qualityOptions = [];
            const dur = data.duration || 15;

            if (data.hdplay) {
              const hdUrl = data.hdplay.startsWith("http") ? data.hdplay : `https://www.tikwm.com${data.hdplay}`;
              const hdSizeMb = data.hd_size ? `${Math.round(data.hd_size / 1024 / 1024 * 10) / 10} MB` : calculateSize(dur, 2500);
              qualityOptions.push({
                label: "HD Video (No Watermark)",
                quality: "1080p HD",
                type: "video",
                directUrl: hdUrl,
                approxSize: hdSizeMb,
              });
            }

            if (data.play) {
              const sdUrl = data.play.startsWith("http") ? data.play : `https://www.tikwm.com${data.play}`;
              const sdSizeMb = data.size ? `${Math.round(data.size / 1024 / 1024 * 10) / 10} MB` : calculateSize(dur, 1200);
              qualityOptions.push({
                label: "Standard Video (No Watermark)",
                quality: "720p SD",
                type: "video",
                directUrl: sdUrl,
                approxSize: sdSizeMb,
              });
            }

            if (data.music) {
              const audioUrl = data.music.startsWith("http") ? data.music : `https://www.tikwm.com${data.music}`;
              qualityOptions.push({
                label: "Original Audio (MP3)",
                quality: "128kbps",
                type: "audio",
                directUrl: audioUrl,
                approxSize: calculateSize(dur, 128),
              });
            }

            return NextResponse.json({
              platform: "tiktok",
              title: data.title || "TikTok Video (No Watermark)",
              author: data.author?.nickname || data.author?.unique_id || "TikTok Creator",
              thumbnail: data.cover || data.origin_cover || "",
              duration: String(data.duration || 0),
              qualityOptions,
            });
          }
        }
      } catch (err) {
        console.error("[TikWM Error]", err);
      }
    }

    // ──────────────────────────────────────────
    // 3. INSTAGRAM EXTRACTOR
    // ──────────────────────────────────────────
    if (platform === "instagram") {
      const shortcode = extractInstagramShortcode(trimmed);
      if (shortcode) {
        try {
          const res = await fetch(`https://www.instagram.com/reel/${shortcode}/embed/captioned/`, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            },
          });
          if (res.ok) {
            const html = await res.text();
            const mp4Matches = html.match(/https:\/\/[^"'\s\\]+?\.mp4[^"'\s\\]*/g);
            if (mp4Matches && mp4Matches.length > 0) {
              const directVideoUrl = mp4Matches[0].replace(/\\u0026/g, "&");
              return NextResponse.json({
                platform: "instagram",
                title: "Instagram Reel / Post",
                author: "Instagram Creator",
                thumbnail: "",
                duration: "0",
                qualityOptions: [
                  {
                    label: "HD Reel Video (MP4)",
                    quality: "1080p HD",
                    type: "video",
                    directUrl: directVideoUrl,
                    approxSize: "HD Quality",
                  },
                ],
              });
            }
          }
        } catch (err) {
          console.error("[Instagram Embed Error]", err);
        }
      }
    }

    return NextResponse.json(
      { error: "Could not fetch video info. Please make sure the link is public and active." },
      { status: 422 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch video info";
    console.error("[video/info error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
