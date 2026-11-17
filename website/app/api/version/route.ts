import { NextResponse } from "next/server";
import { getAppConfig } from "@/app/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface VersionResponse {
  version: string;
  versionCode: number;
  releaseTitle: string;
  releaseDate: string;
  fileSize: string;
  fileSizeBytes: number;
  mandatory: boolean;
  downloadUrl: string;
  changelog: string[];
}

let cachedVersionData: VersionResponse | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (cachedVersionData && now - lastFetchTimestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedVersionData, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  }

  // 1. Read base config from Cloudflare D1 / store
  const appConfig = await getAppConfig();
  const vCfg = appConfig.versionConfig;

  let version = vCfg.latestVersion || "1.0.16";
  let versionCode = vCfg.versionCode || 10016;
  let releaseTitle = `OmniSaver v${version} - Lakho's Team Official Release`;
  let releaseDate = "2026-11-17";
  let fileSize = "33.7 MB";
  let fileSizeBytes = 35338561;
  let changelog: string[] = vCfg.releaseNotes || [
    "OmniSaver v1.0.16 Official Release",
    "Instagram DOM Media Interceptor & In-App Browser",
    "Pinterest 1080p MP4 & Master HD Photo Downloads",
    "Cloudflare D1 Native Edge Database Support",
  ];

  // 2. Query GitHub Releases API to auto-fetch the newest released APK assets
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const ghRes = await fetch(
      "https://api.github.com/repos/suhail-ahmed-lakho/social-downloading-apk/releases/latest",
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "OmniSaver-Version-Engine",
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
      }
    );
    clearTimeout(timer);

    if (ghRes.ok) {
      const ghData: any = await ghRes.json();
      if (ghData && ghData.tag_name) {
        const tagVer = ghData.tag_name.replace(/^v/, "");
        version = tagVer;
        const parts = tagVer.split(".").map((n: string) => parseInt(n, 10) || 0);
        versionCode = (parts[0] || 1) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);

        if (ghData.name) releaseTitle = ghData.name;
        if (ghData.published_at) releaseDate = ghData.published_at.split("T")[0];

        const apkAsset = ghData.assets?.find((a: any) => typeof a.name === "string" && a.name.endsWith(".apk"));
        if (apkAsset && typeof apkAsset.size === "number" && apkAsset.size > 0) {
          fileSizeBytes = apkAsset.size;
          fileSize = `${(apkAsset.size / (1024 * 1024)).toFixed(1)} MB`;
        }

        if (typeof ghData.body === "string" && ghData.body.trim().length > 0) {
          const lines = ghData.body
            .split("\n")
            .map((l: string) => l.trim().replace(/^[-*•]\s*/, ""))
            .filter((l: string) => l.length > 0 && !l.startsWith("#"));
          if (lines.length > 0) {
            changelog = lines.slice(0, 6);
          }
        }
      }
    }
  } catch (err) {
    // Non-fatal, uses D1 configuration
  }

  const result: VersionResponse = {
    version,
    versionCode,
    releaseTitle,
    releaseDate,
    fileSize,
    fileSizeBytes,
    mandatory: vCfg.forceUpdate || false,
    downloadUrl: vCfg.apkDownloadUrl || "https://looknow.cyou/api/download/apk",
    changelog,
  };

  cachedVersionData = result;
  lastFetchTimestamp = now;

  return NextResponse.json(result, {
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
