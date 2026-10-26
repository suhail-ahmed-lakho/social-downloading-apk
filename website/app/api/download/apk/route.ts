import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const localApkPath = path.join(process.cwd(), "public", "downloads", "omnisaver-latest.apk");

  // If locally hosted APK exists in public/downloads, serve it directly
  if (fs.existsSync(localApkPath)) {
    try {
      const fileBuffer = fs.readFileSync(localApkPath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/vnd.android.package-archive",
          "Content-Disposition": 'attachment; filename="OmniSaver-v1.0.3.apk"',
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    } catch (e) {
      console.error("Error reading local APK:", e);
    }
  }

  // Fallback: If external CDN/storage mirror is defined, redirect there without exposing GitHub
  const mirrorUrl = process.env.APK_DOWNLOAD_MIRROR || "/downloads/omnisaver-latest.apk";
  return NextResponse.redirect(new URL(mirrorUrl, "https://looknow.cyou"), 302);
}
