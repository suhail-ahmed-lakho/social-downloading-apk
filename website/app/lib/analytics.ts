// Real-time Traffic, User Telemetry, and Activity Tracking Engine
// Captures real client IP, geo-location, browser, device, and platform queries

export interface UserActivity {
  id: string;
  ip: string;
  country: string;
  city: string;
  userName: string;
  userEmail?: string;
  avatar?: string;
  device: string;
  browser: string;
  platform: string;
  action: "visit" | "extract" | "download";
  details: string;
  format?: string;
  size?: string;
  status: "SUCCESS" | "BLOCKED" | "FAILED";
  timestamp: string;
}

export interface PlatformStat {
  name: string;
  count: number;
  pct: number;
  color: string;
}

export interface AppSettings {
  apkVersion: string;
  apkReleaseDate: string;
  apkFileSizeBytes: string;
  apkDownloadUrl: string;
  apkForceUpdate: boolean;
  apkChangelog: string;
  enableGoogleAdSense: boolean;
  adSensePublisherId: string;
  enableHeaderSponsorBanner: boolean;
  sponsorBannerText: string;
  sponsorBannerUrl: string;
}

// In-memory telemetry cache (persists during worker lifecycle)
interface TelemetryStore {
  activities: UserActivity[];
  blockedIPs: Set<string>;
  totalBandwidthBytes: number;
  enginePings: Record<string, { status: string; latencyMs: number; lastChecked: string }>;
  appSettings: AppSettings;
}

// Persistent telemetry store across worker / module reloads
const globalStore: TelemetryStore =
  (globalThis as any).__omnisaver_telemetry__ ||
  ((globalThis as any).__omnisaver_telemetry__ = {
    activities: [],
    blockedIPs: new Set(["198.51.100.44", "203.0.113.195"]),
    totalBandwidthBytes: 0,
    enginePings: {},
    appSettings: {
      apkVersion: "1.0.4",
      apkReleaseDate: "2026-10-25",
      apkFileSizeBytes: "15.2 MB",
      apkDownloadUrl: "/downloads/omnisaver-latest.apk",
      apkForceUpdate: false,
      apkChangelog: "Added 4K 60fps YouTube extraction, TikTok no-watermark HD, and background download notifications.",
      enableGoogleAdSense: false,
      adSensePublisherId: "ca-pub-XXXXXXXXXXXXXXXX",
      enableHeaderSponsorBanner: true,
      sponsorBannerText: "⚡ Unlimited 4K Media Downloads — Fast & Free",
      sponsorBannerUrl: "https://looknow.cyou",
    },
  });

export function getAppSettings(): AppSettings {
  return globalStore.appSettings;
}

export function updateAppSettings(partial: Partial<AppSettings>): AppSettings {
  globalStore.appSettings = {
    ...globalStore.appSettings,
    ...partial,
  };
  return globalStore.appSettings;
}

export function parseDevice(ua: string): { device: string; browser: string } {
  let device = "Desktop PC";
  let browser = "Chrome";

  if (/android/i.test(ua)) device = "Android Mobile";
  else if (/iphone|ipad|ipod/i.test(ua)) device = "iOS iPhone";
  else if (/macintosh|mac os x/i.test(ua)) device = "macOS Mac";
  else if (/windows/i.test(ua)) device = "Windows PC";
  else if (/linux/i.test(ua)) device = "Linux PC";

  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/opera|opr/i.test(ua)) browser = "Opera";

  return { device, browser };
}

export function isIPBlocked(ip: string): boolean {
  return globalStore.blockedIPs.has(ip);
}

export function blockIPAddress(ip: string): void {
  globalStore.blockedIPs.add(ip);
}

export function unblockIPAddress(ip: string): void {
  globalStore.blockedIPs.delete(ip);
}

export function getBlockedIPList(): string[] {
  return Array.from(globalStore.blockedIPs);
}

export function logActivity(activity: Omit<UserActivity, "id" | "timestamp">): UserActivity {
  const record: UserActivity = {
    ...activity,
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  // Keep last 250 real activities
  globalStore.activities.unshift(record);
  if (globalStore.activities.length > 250) {
    globalStore.activities.pop();
  }

  return record;
}

export function getRealActivities(): UserActivity[] {
  return globalStore.activities;
}

export function getUniqueUsers(): Array<{
  ip: string;
  name: string;
  email?: string;
  country: string;
  city: string;
  device: string;
  browser: string;
  lastSeen: string;
  totalExtractions: number;
  lastPlatform: string;
  isBlocked: boolean;
}> {
  const userMap = new Map<string, any>();

  for (const act of globalStore.activities) {
    if (!userMap.has(act.ip)) {
      userMap.set(act.ip, {
        ip: act.ip,
        name: act.userName,
        email: act.userEmail,
        country: act.country,
        city: act.city,
        device: act.device,
        browser: act.browser,
        lastSeen: act.timestamp,
        totalExtractions: act.action === "extract" || act.action === "download" ? 1 : 0,
        lastPlatform: act.platform,
        isBlocked: globalStore.blockedIPs.has(act.ip),
      });
    } else {
      const existing = userMap.get(act.ip);
      if (act.action === "extract" || act.action === "download") {
        existing.totalExtractions += 1;
      }
      if (act.userName && act.userName !== "Anonymous Guest") {
        existing.name = act.userName;
      }
      if (act.userEmail) {
        existing.email = act.userEmail;
      }
    }
  }

  return Array.from(userMap.values());
}

export function getRealMetrics() {
  const totalQueries = globalStore.activities.filter(
    (a) => a.action === "extract" || a.action === "download"
  ).length;

  const platformCounts: Record<string, number> = {
    youtube: 0,
    tiktok: 0,
    instagram: 0,
    twitter: 0,
    facebook: 0,
  };

  let totalMegabytes = 0;

  for (const a of globalStore.activities) {
    const key = a.platform.toLowerCase();
    if (key in platformCounts) {
      platformCounts[key]++;
    }

    if (a.size) {
      if (a.size.includes("GB")) {
        const val = parseFloat(a.size);
        if (!isNaN(val)) totalMegabytes += val * 1024;
      } else if (a.size.includes("MB")) {
        const val = parseFloat(a.size);
        if (!isNaN(val)) totalMegabytes += val;
      } else if (a.size.includes("KB")) {
        const val = parseFloat(a.size);
        if (!isNaN(val)) totalMegabytes += val / 1024;
      }
    }
  }

  const safeTotal = totalQueries || 1;
  const platformStats: PlatformStat[] = [
    {
      name: "TikTok (1080p No Watermark)",
      count: platformCounts.tiktok,
      pct: totalQueries > 0 ? Math.round((platformCounts.tiktok / safeTotal) * 100) : 0,
      color: "#00F2FE",
    },
    {
      name: "YouTube (4K & Lossless MP3)",
      count: platformCounts.youtube,
      pct: totalQueries > 0 ? Math.round((platformCounts.youtube / safeTotal) * 100) : 0,
      color: "#FF0000",
    },
    {
      name: "Instagram (Reels & Posts)",
      count: platformCounts.instagram,
      pct: totalQueries > 0 ? Math.round((platformCounts.instagram / safeTotal) * 100) : 0,
      color: "#E1306C",
    },
    {
      name: "Twitter / X (HD Clips)",
      count: platformCounts.twitter,
      pct: totalQueries > 0 ? Math.round((platformCounts.twitter / safeTotal) * 100) : 0,
      color: "#CBD5E1",
    },
    {
      name: "Facebook (Public HD Streams)",
      count: platformCounts.facebook,
      pct: totalQueries > 0 ? Math.round((platformCounts.facebook / safeTotal) * 100) : 0,
      color: "#1877F2",
    },
  ];

  const uniqueIPs = new Set(globalStore.activities.map((a) => a.ip)).size;

  const bandwidthFormatted =
    totalMegabytes >= 1024
      ? `${(totalMegabytes / 1024).toFixed(2)} GB`
      : `${totalMegabytes.toFixed(1)} MB`;

  return {
    totalExtractions: totalQueries,
    uniqueVisitors: uniqueIPs,
    totalActivities: globalStore.activities.length,
    blockedCount: globalStore.blockedIPs.size,
    totalBandwidth: bandwidthFormatted,
    platforms: platformStats,
  };
}
