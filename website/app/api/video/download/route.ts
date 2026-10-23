import { NextRequest, NextResponse } from "next/server";

// POST endpoint for interactive step-by-step progress polling
export async function POST(req: NextRequest) {
  try {
    const { videoId, format = "mp3", action = "init", progressUrl } = await req.json();

    if (action === "init") {
      if (!videoId) {
        return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
      }

      let targetFormat = "mp3";
      if (format === "4k" || format === "2160") {
        targetFormat = "4k";
      } else if (format === "1440" || format === "1080" || format === "720" || format === "480" || format === "360") {
        targetFormat = format;
      } else if (format === "mp3" || format === "128") {
        targetFormat = "mp3";
      }
      const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const endpoint = `https://loader.to/ajax/download.php?format=${targetFormat}&url=${encodeURIComponent(fullUrl)}`;

      const res = await fetch(endpoint, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: "Converter service temporarily busy. Please try again." },
          { status: 502 }
        );
      }

      const data = await res.json();

      if (data.download_url && data.download_url.startsWith("http")) {
        return NextResponse.json({
          status: "done",
          downloadUrl: data.download_url,
          title: data.title,
        });
      }

      if (data.progress_url) {
        return NextResponse.json({
          status: "processing",
          progressUrl: data.progress_url,
          progress: 10,
          text: data.text || "Starting conversion...",
        });
      }

      return NextResponse.json({
        status: "fallback",
        downloadUrl: `https://en.savefrom.net/#url=https://www.youtube.com/watch?v=${videoId}`,
      });
    }

    if (action === "poll") {
      if (!progressUrl) {
        return NextResponse.json({ error: "Missing progressUrl" }, { status: 400 });
      }

      const pollRes = await fetch(progressUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!pollRes.ok) {
        return NextResponse.json({ status: "processing", progress: 50, text: "Converting..." });
      }

      const pollData = await pollRes.json();

      if (pollData.download_url && pollData.download_url.startsWith("http")) {
        return NextResponse.json({
          status: "done",
          downloadUrl: pollData.download_url,
          title: pollData.title,
        });
      }

      const pct = typeof pollData.progress === "number" ? Math.round(pollData.progress / 10) : 50;

      return NextResponse.json({
        status: "processing",
        progress: Math.min(95, Math.max(15, pct)),
        text: pollData.text || "Processing media stream...",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    console.error("[Download API Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET endpoint (for direct link / legacy fallback)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");
  const format = searchParams.get("format") || "mp3";

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  let targetFormat = "mp3";
  if (format === "4k" || format === "2160") {
    targetFormat = "4k";
  } else if (format === "1440" || format === "1080" || format === "720" || format === "480" || format === "360") {
    targetFormat = format;
  } else if (format === "mp3" || format === "128") {
    targetFormat = "mp3";
  }
  const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const endpoint = `https://loader.to/ajax/download.php?format=${targetFormat}&url=${encodeURIComponent(fullUrl)}`;

  try {
    const initRes = await fetch(endpoint, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    if (initRes.ok) {
      const initData = await initRes.json();
      if (initData.download_url && initData.download_url.startsWith("http")) {
        return NextResponse.redirect(initData.download_url);
      }

      if (initData.progress_url) {
        // Poll for up to 18 seconds (gives ample time to reach 100%)
        for (let i = 0; i < 12; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          try {
            const pollRes = await fetch(initData.progress_url, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Accept: "application/json",
              },
            });
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.download_url && pollData.download_url.startsWith("http")) {
                return NextResponse.redirect(pollData.download_url);
              }
            }
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

  return NextResponse.redirect(`https://en.savefrom.net/#url=https://www.youtube.com/watch?v=${videoId}`);
}
