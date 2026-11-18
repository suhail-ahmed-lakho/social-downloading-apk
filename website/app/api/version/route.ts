import { NextResponse } from "next/server";
import { getAppConfig } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const appConfig = await getAppConfig();
  const vCfg = appConfig.versionConfig;

  const version = vCfg.latestVersion || "1.0.18";
  const versionCode = vCfg.versionCode || 10018;
  const releaseTitle = `OmniSaver v${version} - Lakho's Team Official Release`;
  const releaseDate = new Date().toISOString().split("T")[0];
  const fileSize = "35.3 MB";
  const fileSizeBytes = 37072550;
  const changelog = vCfg.releaseNotes || [
    `OmniSaver v${version} Luxury Edition by Lakho's Team`,
    "Luxury Obsidian Gold PRO Header Badge with metallic VIP styling",
    "Crisp Vector Iconography across all screens (zero Unicode emojis)",
    "Secure In-App TID Activation with 24-hour instant grace period",
    "Real-Time Dual-Host Telemetry & Active Device Tracking (Cloudflare D1)",
    "Enhanced In-App Browser & Instagram Private Reel Interceptor",
    "Optimized Pro Comparison Table formatting & PRO BOOST card design",
  ];

  return NextResponse.json(
    {
      version,
      versionCode,
      releaseTitle,
      releaseDate,
      fileSize,
      fileSizeBytes,
      mandatory: vCfg.forceUpdate || false,
      downloadUrl: vCfg.apkDownloadUrl || "https://looknow.cyou/api/download/apk",
      changelog,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    }
  );
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
