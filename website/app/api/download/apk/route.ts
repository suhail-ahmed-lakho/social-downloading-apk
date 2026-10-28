import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const localApkPath = path.join(process.cwd(), "public", "downloads", "omnisaver-latest.apk");

  // 1. If locally hosted APK exists in public/downloads (e.g. Docker / VPS), serve directly
  if (fs.existsSync(localApkPath)) {
    try {
      const fileBuffer = fs.readFileSync(localApkPath);
      if (fileBuffer.length > 0) {
        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": "application/vnd.android.package-archive",
            "Content-Disposition": 'attachment; filename="OmniSaver-latest.apk"',
            "Content-Length": fileBuffer.length.toString(),
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      }
    } catch (e) {
      console.error("Error reading local APK:", e);
    }
  }

  // 2. Dynamically resolve upstream URL from latest GitHub Release
  let upstreamUrl = process.env.APK_DOWNLOAD_MIRROR;
  let filename = "OmniSaver-latest.apk";

  if (!upstreamUrl) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const ghRes = await fetch(
        "https://api.github.com/repos/suhail-ahmed-lakho/social-downloading-apk/releases/latest",
        {
          signal: controller.signal,
          headers: {
            "User-Agent": "LookNow-Downloader",
            Accept: "application/vnd.github.v3+json",
            ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
          },
        }
      );
      clearTimeout(timer);

      if (ghRes.ok) {
        const ghData = await ghRes.json();
        const apkAsset = ghData.assets?.find((a: any) => typeof a.name === "string" && a.name.endsWith(".apk"));
        if (apkAsset?.browser_download_url) {
          upstreamUrl = apkAsset.browser_download_url;
          filename = apkAsset.name;
        }
      }
    } catch (err) {
      console.warn("Could not query GitHub releases API for APK URL, using direct latest download fallback:", err);
    }
  }

  // Fallback to GitHub's perpetual latest release asset URL
  if (!upstreamUrl) {
    upstreamUrl = "https://github.com/suhail-ahmed-lakho/social-downloading-apk/releases/latest/download/OmniSaver-latest.apk";
  }

  // 3. Stream upstream APK to client as direct download
  try {
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      redirect: "follow",
    });

    if (upstreamRes.ok && upstreamRes.body) {
      const contentLength = upstreamRes.headers.get("content-length");
      const headers: Record<string, string> = {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      };
      if (contentLength) {
        headers["Content-Length"] = contentLength;
      }
      return new Response(upstreamRes.body as any, { headers });
    }
  } catch (err) {
    console.error("Error streaming APK from upstream, falling back to redirect:", err);
  }

  // 4. Redirect fallback if streaming encountered issues
  return NextResponse.redirect(upstreamUrl, 302);
}
