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
            "Content-Disposition": 'attachment; filename="OmniSaver-v1.0.3.apk"',
            "Content-Length": fileBuffer.length.toString(),
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      }
    } catch (e) {
      console.error("Error reading local APK:", e);
    }
  }

  // 2. If running on serverless (Cloudflare / Vercel) where 70MB file is not in git:
  // Fetch stream from official release asset and pipe directly to user as an attachment
  const upstreamUrl =
    process.env.APK_DOWNLOAD_MIRROR ||
    "https://github.com/suhail-ahmed-lakho/social-downloading-apk/releases/download/v1.0.2/OmniSaver-v1.0.2.apk";

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
      const contentLength = upstreamRes.headers.get("content-length") || "74262740";
      return new Response(upstreamRes.body as any, {
        headers: {
          "Content-Type": "application/vnd.android.package-archive",
          "Content-Disposition": 'attachment; filename="OmniSaver-v1.0.3.apk"',
          "Content-Length": contentLength,
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }
  } catch (err) {
    console.error("Error streaming APK from upstream:", err);
  }

  // 3. Fallback redirect if streaming fails
  return NextResponse.redirect(upstreamUrl, 302);
}
