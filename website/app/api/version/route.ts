import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

// In-memory cache for fast edge and server responses
let cachedVersionData: VersionResponse | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

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

  // Baseline fallback data
  let version = "1.0.4";
  let versionCode = 10004;
  let releaseTitle = "OmniSaver v1.0.4 Official Release";
  let releaseDate = "2026-10-28";
  let fileSize = "70.8 MB";
  let fileSizeBytes = 74262740;
  let changelog: string[] = [
    "OmniSaver v1.0.4 - Official Release by Lakho's Team",
    "Streaming downloads directly via local proxy (no 404s or broken redirects)",
    "Synchronized exact 70.8 MB release APK size across app & website",
    "Ultra HD 4K (2160p) and 2K (1440p) direct stream extractor optimizations",
    "Lossless 320kbps MP3 audio extractor engine enhancements",
    "Autonomous multi-tier update delivery channel"
  ];

  // 1. Try reading local public/version.json if filesystem is available
  try {
    const localVersionPath = path.join(process.cwd(), "public", "version.json");
    if (fs.existsSync(localVersionPath)) {
      const raw = JSON.parse(fs.readFileSync(localVersionPath, "utf8"));
      if (raw.version) version = raw.version;
      if (raw.versionCode) versionCode = raw.versionCode;
      if (raw.releaseTitle) releaseTitle = raw.releaseTitle;
      if (raw.releaseDate) releaseDate = raw.releaseDate;
      if (raw.fileSize) fileSize = raw.fileSize;
      if (raw.fileSizeBytes) fileSizeBytes = raw.fileSizeBytes;
      if (Array.isArray(raw.changelog) && raw.changelog.length > 0) changelog = raw.changelog;
    }
  } catch (_) {}

  // 2. Query GitHub Releases API to auto-fetch the newest released APK
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const ghRes = await fetch(
      "https://api.github.com/repos/suhail-ahmed-lakho/social-downloading-apk/releases/latest",
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "LookNow-Version-Engine",
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
      }
    );
    clearTimeout(timer);

    if (ghRes.ok) {
      const ghData = await ghRes.json();
      if (ghData && ghData.tag_name) {
        const tagVer = ghData.tag_name.replace(/^v/, "");
        version = tagVer;
        const parts = tagVer.split(".").map((n: string) => parseInt(n, 10) || 0);
        versionCode = (parts[0] || 1) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);

        if (ghData.name) {
          releaseTitle = ghData.name;
        }
        if (ghData.published_at) {
          releaseDate = ghData.published_at.split("T")[0];
        }

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
    // Non-fatal: fallback to bundled version
    console.warn("GitHub release check skipped/failed, using fallback version:", err);
  }

  const result: VersionResponse = {
    version,
    versionCode,
    releaseTitle,
    releaseDate,
    fileSize,
    fileSizeBytes,
    mandatory: false,
    downloadUrl: "https://looknow.cyou/api/download/apk",
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
