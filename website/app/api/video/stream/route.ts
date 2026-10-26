import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s.-]/gi, "")
    .trim()
    .slice(0, 80) || "OmniSaver_Media";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaUrl = searchParams.get("url");
    const rawTitle = searchParams.get("title") || "OmniSaver_Download";
    const ext = searchParams.get("format") || "mp4";

    if (!mediaUrl || !mediaUrl.startsWith("http")) {
      return NextResponse.json({ error: "Valid media URL is required" }, { status: 400 });
    }

    const cleanTitle = sanitizeFilename(rawTitle);
    const filename = `${cleanTitle}.${ext}`;

    // Request headers to bypass hotlinking and CDN restrictions
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Encoding": "identity",
    };

    if (mediaUrl.includes("tiktokcdn.com") || mediaUrl.includes("tiktok.com")) {
      headers["Referer"] = "https://www.tiktok.com/";
    } else if (mediaUrl.includes("instagram.com") || mediaUrl.includes("cdninstagram.com") || mediaUrl.includes("fbcdn.net")) {
      headers["Referer"] = "https://www.instagram.com/";
    } else if (mediaUrl.includes("twimg.com") || mediaUrl.includes("twitter.com") || mediaUrl.includes("x.com")) {
      headers["Referer"] = "https://twitter.com/";
    }

    const rangeHeader = req.headers.get("range");
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    const upstreamRes = await fetch(mediaUrl, {
      method: "GET",
      headers,
      redirect: "follow",
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return NextResponse.redirect(mediaUrl);
    }

    const contentType =
      upstreamRes.headers.get("content-type") ||
      (ext === "mp3" ? "audio/mpeg" : "video/mp4");
    const contentLength = upstreamRes.headers.get("content-length");
    const contentRange = upstreamRes.headers.get("content-range");

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    };

    if (contentLength) responseHeaders["Content-Length"] = contentLength;
    if (contentRange) responseHeaders["Content-Range"] = contentRange;

    return new Response(upstreamRes.body as any, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Stream failed";
    console.error("[Stream API Error]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
