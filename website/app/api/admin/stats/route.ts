import { NextRequest, NextResponse } from "next/server";
import {
  getRealMetrics,
  getUniqueUsers,
  getRealActivities,
  getBlockedIPList,
  blockIPAddress,
  unblockIPAddress,
  getAppSettings,
  updateAppSettings,
} from "@/app/lib/analytics";

export async function GET(req: NextRequest) {
  try {
    const timestamp = new Date().toISOString();

    const engines = [
      {
        id: "youtube",
        name: "YouTube 4K & MP3 Extractor",
        status: "operational",
        latencyMs: 142,
        uptime: "99.8%",
        supportedFormats: ["2160p 4K", "1440p 2K", "1080p HD", "720p", "320kbps MP3"],
      },
      {
        id: "tiktok",
        name: "TikTok No-Watermark Engine",
        status: "operational",
        latencyMs: 95,
        uptime: "100.0%",
        supportedFormats: ["1080p HD", "720p SD", "Original MP3"],
      },
      {
        id: "instagram",
        name: "Instagram Reels & Video Stream",
        status: "operational",
        latencyMs: 138,
        uptime: "99.9%",
        supportedFormats: ["1080p HD MP4"],
      },
      {
        id: "twitter",
        name: "Twitter / X Video Stream",
        status: "operational",
        latencyMs: 110,
        uptime: "100.0%",
        supportedFormats: ["720p HD MP4"],
      },
      {
        id: "facebook",
        name: "Facebook Public Video Stream",
        status: "operational",
        latencyMs: 205,
        uptime: "99.5%",
        supportedFormats: ["720p HD", "SD MP4"],
      },
    ];

    // Real Metrics directly computed from live requests
    const metrics = getRealMetrics();
    const users = getUniqueUsers();
    const activities = getRealActivities();
    const blockedIPs = getBlockedIPList();
    const appSettings = getAppSettings();

    return NextResponse.json({
      success: true,
      timestamp,
      metrics,
      users,
      activities,
      blockedIPs,
      appSettings,
      engines,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch admin stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "block_ip") {
      const { ip } = body;
      if (!ip || typeof ip !== "string") {
        return NextResponse.json({ error: "Valid IP address required" }, { status: 400 });
      }
      blockIPAddress(ip.trim());
      return NextResponse.json({
        success: true,
        message: `IP ${ip.trim()} successfully added to firewall blocklist`,
        blockedIPs: getBlockedIPList(),
        users: getUniqueUsers(),
      });
    }

    if (action === "unblock_ip") {
      const { ip } = body;
      if (!ip || typeof ip !== "string") {
        return NextResponse.json({ error: "Valid IP address required" }, { status: 400 });
      }
      unblockIPAddress(ip.trim());
      return NextResponse.json({
        success: true,
        message: `IP ${ip.trim()} successfully unblocked from firewall`,
        blockedIPs: getBlockedIPList(),
        users: getUniqueUsers(),
      });
    }

    if (action === "update_apk") {
      const { settings } = body;
      if (!settings) {
        return NextResponse.json({ error: "Settings required" }, { status: 400 });
      }
      const updated = updateAppSettings({
        apkVersion: settings.version || settings.apkVersion,
        apkReleaseDate: settings.releaseDate || settings.apkReleaseDate,
        apkFileSizeBytes: settings.fileSizeBytes || settings.apkFileSizeBytes,
        apkDownloadUrl: settings.downloadUrl || settings.apkDownloadUrl,
        apkForceUpdate: !!settings.forceUpdate,
        apkChangelog: settings.changelog || settings.apkChangelog,
      });
      return NextResponse.json({ success: true, appSettings: updated });
    }

    if (action === "update_monetization") {
      const { settings } = body;
      if (!settings) {
        return NextResponse.json({ error: "Settings required" }, { status: 400 });
      }
      const updated = updateAppSettings({
        enableGoogleAdSense: !!settings.enableGoogleAdSense,
        adSensePublisherId: settings.adSensePublisherId,
        enableHeaderSponsorBanner: !!settings.enableHeaderSponsorBanner,
        sponsorBannerText: settings.sponsorBannerText,
        sponsorBannerUrl: settings.sponsorBannerUrl,
      });
      return NextResponse.json({ success: true, appSettings: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute admin action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
