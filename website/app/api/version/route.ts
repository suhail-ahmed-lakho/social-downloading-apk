import { NextResponse } from "next/server";

export async function GET() {
  const versionData = {
    version: "1.0.3",
    versionCode: 10003,
    releaseTitle: "OmniSaver v1.0.3 Official Release",
    releaseDate: "2026-10-26",
    fileSize: "15.4 MB",
    fileSizeBytes: 16148070,
    mandatory: false,
    downloadUrl: "https://looknow.cyou/api/download/apk",
    changelog: [
      "OmniSaver v1.0.3 - Official Release by Lakho's Team",
      "Full Ultra HD 4K (2160p) and 2K (1440p) direct video stream extraction",
      "Studio Lossless MP3 audio (320kbps) & HD video extractor optimizations",
      "Unified LookNow vibrant theme and modern holographic launch animation",
      "Clean zero-watermark TikTok and Instagram Reels extraction engine",
      "Autonomous self-hosted update delivery channel"
    ],
  };

  return NextResponse.json(versionData, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
