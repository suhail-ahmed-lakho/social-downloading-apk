// OmniSaver Universal Database Layer
export type EventSource = "website" | "mobile_app";
export type EventAction = "visit" | "extract" | "download" | "apk_click" | "heartbeat" | "login";

export interface AnalyticsEvent {
  id: string;
  timestamp: string;
  source: EventSource;
  action: EventAction;
  platform?: string;
  deviceId?: string;
  isPro?: boolean;
  ip: string;
  country: string;
  city: string;
  device?: string;
  browser?: string;
  status: "SUCCESS" | "BLOCKED" | "FAILED";
  details?: string;
  metadata?: Record<string, any>;
}

export type ProPlanType = "monthly" | "quarterly" | "yearly";

export interface ProLicense {
  id: string;
  key: string; // e.g. OMNI-PRO-XXXX-XXXX
  deviceId: string; // e.g. OMNI-XXXX-XXXX
  planType: ProPlanType;
  pricePkr: number;
  status: "active" | "pending" | "revoked" | "expired";
  issuedAt: string;
  expiresAt: number; // Unix timestamp ms
  notes?: string;
  tid?: string;
}

export interface AppRemoteConfig {
  paymentDetails: {
    easypaisa: { title: string; accountNo: string };
    nayapay: { title: string; accountId: string };
    bankIban: { bank: string; title: string; iban: string };
    whatsappNumber: string;
  };
  adConfig: {
    adsEnabled: boolean;
    bannerEnabled: boolean;
    interstitialEnabled: boolean;
    rewardedEnabled: boolean;
    interstitialInterval: number;
    admobBannerId?: string;
    admobInterstitialId?: string;
    admobRewardedId?: string;
  };
  versionConfig: {
    latestVersion: string;
    versionCode: number;
    apkDownloadUrl: string;
    forceUpdate: boolean;
    releaseNotes: string[];
  };
  proPricing: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
}

const DEFAULT_CONFIG: AppRemoteConfig = {
  paymentDetails: {
    easypaisa: {
      title: "Suhail Ahmed",
      accountNo: "03078235748",
    },
    nayapay: {
      title: "Suhail Ahmed",
      accountId: "03078235748",
    },
    bankIban: {
      bank: "Meezan Bank Limited",
      title: "Suhail Ahmed",
      iban: "PK36MEZN0001234567890123",
    },
    whatsappNumber: "03078235748",
  },
  adConfig: {
    adsEnabled: true,
    bannerEnabled: true,
    interstitialEnabled: true,
    rewardedEnabled: true,
    interstitialInterval: 2,
    admobBannerId: "ca-app-pub-3940256099942544/6300978111",
    admobInterstitialId: "ca-app-pub-3940256099942544/1033173712",
    admobRewardedId: "ca-app-pub-3940256099942544/5224354917",
  },
  versionConfig: {
    latestVersion: "1.0.18",
    versionCode: 10018,
    apkDownloadUrl: "https://looknow.cyou/api/download/apk",
    forceUpdate: false,
    releaseNotes: [
      "OmniSaver v1.0.18 Luxury Edition by Lakho's Team",
      "Luxury Obsidian Gold PRO Header Badge with metallic VIP styling",
      "Crisp Vector Iconography across all screens (zero Unicode emojis)",
      "Secure In-App TID Activation with 24-hour instant grace period",
      "Dual-Host Edge Telemetry & Real-Time Device Tracking (Cloudflare D1)",
      "Optimized Pro Comparison Table formatting & PRO BOOST card design",
    ],
  },
  proPricing: {
    monthly: 750,
    quarterly: 1800,
    yearly: 4500,
  },
};

// ==========================================
// In-Memory Fallback Store (Local Dev & Tests)
// ==========================================
interface MemoryStore {
  events: AnalyticsEvent[];
  licenses: ProLicense[];
  config: AppRemoteConfig;
}

const fallbackStore: MemoryStore =
  (globalThis as any).__omnisaver_d1_fallback__ ||
  ((globalThis as any).__omnisaver_d1_fallback__ = {
    events: [],
    licenses: [
      {
        id: "lic_init_seed",
        key: "OMNI-PRO-DEMO-2026",
        deviceId: "OMNI-DEMO-DEVICE",
        planType: "yearly",
        pricePkr: 4500,
        status: "active",
        issuedAt: new Date().toISOString(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        notes: "Demo Starter VIP Key",
        tid: "EP-98234710",
      },
      {
        id: "lic_vip_promo_1",
        key: "OMNI-PRO-VIP",
        deviceId: "",
        planType: "yearly",
        pricePkr: 4500,
        status: "active",
        issuedAt: new Date().toISOString(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        notes: "VIP Master Promo Code in Database",
        tid: "PROMO-VIP-1",
      },
      {
        id: "lic_vip_promo_2",
        key: "LOOKNOW-VIP",
        deviceId: "",
        planType: "yearly",
        pricePkr: 4500,
        status: "active",
        issuedAt: new Date().toISOString(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        notes: "LookNow VIP Promo Code in Database",
        tid: "PROMO-VIP-2",
      },
    ],
    config: DEFAULT_CONFIG,
  });

// ==========================================
// Cloudflare D1 Database Resolver
// ==========================================
export function getD1(): any | null {
  try {
    if ((globalThis as any).DB) {
      return (globalThis as any).DB;
    }
  } catch (_) {}

  try {
    const g = globalThis as any;
    if (g.__cloudflare_context__?.env?.DB) {
      return g.__cloudflare_context__.env.DB;
    }
    if (g.env?.DB) {
      return g.env.DB;
    }
  } catch (_) {}

  try {
    if (typeof process !== "undefined" && (process.env as any)?.DB) {
      return (process.env as any).DB;
    }
  } catch (_) {}

  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    if (ctx?.env?.DB) return ctx.env.DB;
  } catch (_) {}

  try {
    const nop = require("@cloudflare/next-on-pages");
    if (nop && typeof nop.getRequestContext === "function") {
      const ctx = nop.getRequestContext();
      if (ctx?.env?.DB) return ctx.env.DB;
    }
  } catch (_) {}

  return null;
}

// Generate Edge-Safe Random Key via Web Crypto API
export function generateLicenseKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const part1 = Array.from(bytes.slice(0, 4), (b) => chars[b % chars.length]).join("");
  const part2 = Array.from(bytes.slice(4, 8), (b) => chars[b % chars.length]).join("");
  return `OMNI-PRO-${part1}-${part2}`;
}

// Generate Edge-Safe Unique ID
export function generateId(prefix: string): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, (b) => b.toString(36)).join("").slice(0, 6);
  return `${prefix}_${Date.now()}_${rand}`;
}

// ──────────────────────────────────────────
// 1. EVENT LOGGING & DUAL-CHANNEL ANALYTICS
// ──────────────────────────────────────────

export async function recordEvent(data: Omit<AnalyticsEvent, "id" | "timestamp">): Promise<AnalyticsEvent> {
  const id = generateId("ev");
  const timestamp = new Date().toISOString();
  const event: AnalyticsEvent = { ...data, id, timestamp };

  const db = getD1();
  if (db) {
    try {
      await db
        .prepare(
          `INSERT INTO omnisaver_telemetry (id, source, event_type, platform, device_id, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id,
          data.source,
          data.action,
          data.platform || null,
          data.deviceId || null,
          JSON.stringify({
            ip: data.ip,
            country: data.country,
            city: data.city,
            device: data.device,
            browser: data.browser,
            status: data.status,
            details: data.details,
            isPro: data.isPro,
            ...(data.metadata || {}),
          }),
          Date.now()
        )
        .run();
      return event;
    } catch (err) {
      console.warn("[D1 recordEvent error]", err);
    }
  }

  // Fallback to in-memory store
  fallbackStore.events.unshift(event);
  if (fallbackStore.events.length > 500) {
    fallbackStore.events.pop();
  }
  return event;
}

export async function getDualChannelStats() {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const db = getD1();
  let eventsList: AnalyticsEvent[] = [];
  let licensesList: ProLicense[] = [];

  if (db) {
    try {
      const [telemetryResult, licensesResult] = await Promise.all([
        db.prepare("SELECT * FROM omnisaver_telemetry ORDER BY created_at DESC LIMIT 400").all(),
        db.prepare("SELECT * FROM omnisaver_licenses").all(),
      ]);

      if (telemetryResult?.results) {
        eventsList = (telemetryResult.results as any[]).map((r) => {
          let meta: any = {};
          try {
            meta = JSON.parse(r.metadata || "{}");
          } catch (_) {}
          return {
            id: r.id,
            timestamp: new Date(r.created_at).toISOString(),
            source: r.source as EventSource,
            action: r.event_type as EventAction,
            platform: r.platform || meta.platform,
            deviceId: r.device_id || meta.deviceId,
            isPro: meta.isPro,
            ip: meta.ip || "127.0.0.1",
            country: meta.country || "Global",
            city: meta.city || "",
            device: meta.device || "Mobile Client",
            browser: meta.browser || "OmniSaver",
            status: meta.status || "SUCCESS",
            details: meta.details || "",
            metadata: meta,
          };
        });
      }

      if (licensesResult?.results) {
        licensesList = (licensesResult.results as any[]).map((l) => ({
          id: l.id,
          key: l.license_key,
          deviceId: l.device_id,
          planType: l.plan_type as ProPlanType,
          pricePkr: Number(l.amount_pkr) || 0,
          status: l.status as "active" | "revoked",
          issuedAt: new Date(l.created_at).toISOString(),
          expiresAt: Number(l.expires_at) || 0,
          notes: l.tid_notes,
          tid: l.tid_notes,
        }));
      }
    } catch (err) {
      console.warn("[D1 getDualChannelStats error, using fallback]", err);
      eventsList = fallbackStore.events;
      licensesList = fallbackStore.licenses;
    }
  } else {
    eventsList = fallbackStore.events;
    licensesList = fallbackStore.licenses;
  }

  // 1. Website Metrics
  const webEvents = eventsList.filter((e) => e.source === "website");
  const webVisitors = new Set(webEvents.map((e) => e.ip)).size;
  const webFetches = webEvents.filter((e) => e.action === "extract");
  const webDownloads = webEvents.filter((e) => e.action === "download");
  const webApkClicks = webEvents.filter(
    (e) => (e.action === "download" && e.platform === "android-apk") || e.action === "apk_click"
  ).length;

  const webDownloadsByPlatform: Record<string, number> = {
    youtube: 0,
    tiktok: 0,
    instagram: 0,
    pinterest: 0,
    twitter: 0,
    facebook: 0,
    other: 0,
  };

  for (const d of webDownloads) {
    const plat = (d.platform || "").toLowerCase();
    if (plat in webDownloadsByPlatform) {
      webDownloadsByPlatform[plat]++;
    } else if (plat !== "android-apk") {
      webDownloadsByPlatform.other++;
    }
  }

  const webFailedLogs = webEvents.filter((e) => e.status === "FAILED").slice(0, 20);

  // 2. Mobile App Metrics
  const mobileEvents = eventsList.filter((e) => e.source === "mobile_app");
  const deviceSet = new Set<string>();
  const activeDayDevices = new Set<string>();
  const activeMonthDevices = new Set<string>();
  const proDeviceSet = new Set<string>();

  for (const e of mobileEvents) {
    const devId = e.deviceId || e.ip;
    deviceSet.add(devId);
    const ts = new Date(e.timestamp).getTime();
    if (ts >= dayAgo) activeDayDevices.add(devId);
    if (ts >= monthAgo) activeMonthDevices.add(devId);
    if (e.isPro) proDeviceSet.add(devId);
  }

  // Include active license device IDs
  for (const lic of licensesList) {
    if (lic.status === "active") {
      deviceSet.add(lic.deviceId);
      proDeviceSet.add(lic.deviceId);
    }
  }

  const mobileDownloads = mobileEvents.filter((e) => e.action === "download");
  const mobileDownloadsByPlatform: Record<string, number> = {
    youtube: 0,
    tiktok: 0,
    instagram: 0,
    pinterest: 0,
    twitter: 0,
    facebook: 0,
    other: 0,
  };

  for (const d of mobileDownloads) {
    const plat = (d.platform || "").toLowerCase();
    if (plat in mobileDownloadsByPlatform) {
      mobileDownloadsByPlatform[plat]++;
    } else {
      mobileDownloadsByPlatform.other++;
    }
  }

  const totalRevenuePkr = licensesList
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + (l.pricePkr || 0), 0);

  const totalDevices = Math.max(deviceSet.size, 1);
  const proCount = proDeviceSet.size;
  const freeCount = Math.max(0, totalDevices - proCount);

  return {
    website: {
      totalVisitors: webVisitors,
      totalFetches: webFetches.length,
      totalDownloads: webDownloads.filter((d) => d.platform !== "android-apk").length,
      apkClicks: webApkClicks,
      downloadsByPlatform: webDownloadsByPlatform,
      failedLogs: webFailedLogs,
      recentEvents: webEvents.slice(0, 30),
    },
    mobile: {
      totalRegisteredDevices: deviceSet.size,
      dau: activeDayDevices.size,
      mau: activeMonthDevices.size,
      totalDownloads: mobileDownloads.length,
      downloadsByPlatform: mobileDownloadsByPlatform,
      proUsers: proCount,
      freeUsers: freeCount,
      proRatioPct: totalDevices > 0 ? Math.round((proCount / totalDevices) * 100) : 0,
      totalRevenuePkr,
      recentEvents: mobileEvents.slice(0, 30),
    },
  };
}

// ──────────────────────────────────────────
// 2. PRO LICENSE MANAGEMENT
// ──────────────────────────────────────────

export async function listLicenses(): Promise<ProLicense[]> {
  const db = getD1();
  const now = Date.now();

  if (db) {
    try {
      const res = await db.prepare("SELECT * FROM omnisaver_licenses ORDER BY created_at DESC").all();
      if (res?.results) {
        return (res.results as any[]).map((l) => {
          const isExpired = Number(l.expires_at) < now;
          const status = l.status === "active" && isExpired ? "revoked" : l.status;
          return {
            id: l.id,
            key: l.license_key,
            deviceId: l.device_id,
            planType: l.plan_type as ProPlanType,
            pricePkr: Number(l.amount_pkr) || 0,
            status,
            issuedAt: new Date(l.created_at).toISOString(),
            expiresAt: Number(l.expires_at) || 0,
            notes: l.tid_notes,
            tid: l.tid_notes,
          };
        });
      }
    } catch (err) {
      console.warn("[D1 listLicenses error]", err);
    }
  }

  return fallbackStore.licenses.map((lic) => {
    if (lic.status === "active" && lic.expiresAt < now) {
      return { ...lic, status: "revoked" as const };
    }
    return lic;
  });
}

export async function createLicense(params: {
  deviceId: string;
  planType: ProPlanType;
  pricePkr?: number;
  notes?: string;
  tid?: string;
  key?: string;
  status?: "active" | "pending" | "revoked";
  expiresAt?: number;
}): Promise<ProLicense> {
  const cleanDevice = params.deviceId.trim().toUpperCase();
  const pricing = DEFAULT_CONFIG.proPricing;
  const defaultPrice =
    params.planType === "monthly"
      ? pricing.monthly
      : params.planType === "quarterly"
      ? pricing.quarterly
      : pricing.yearly;

  const durationDays =
    params.planType === "monthly" ? 30 : params.planType === "quarterly" ? 90 : 365;

  const key = params.key ? params.key.trim().toUpperCase() : generateLicenseKey();
  const id = generateId("lic");
  const now = Date.now();
  const expiresAt = params.expiresAt ?? (now + durationDays * 24 * 60 * 60 * 1000);
  const pricePkr = params.pricePkr ?? defaultPrice;
  const tidNotes = [params.tid, params.notes].filter(Boolean).join(" - ") || undefined;
  const initialStatus = params.status || "active";

  const license: ProLicense = {
    id,
    key,
    deviceId: cleanDevice,
    planType: params.planType,
    pricePkr,
    status: initialStatus,
    issuedAt: new Date(now).toISOString(),
    expiresAt,
    notes: tidNotes,
    tid: params.tid,
  };

  const db = getD1();
  if (db) {
    try {
      await db
        .prepare(
          `INSERT INTO omnisaver_licenses (id, license_key, device_id, plan_type, amount_pkr, status, tid_notes, created_at, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(id, key, cleanDevice, params.planType, pricePkr, initialStatus, tidNotes || null, now, expiresAt)
        .run();
      return license;
    } catch (err) {
      console.warn("[D1 createLicense error]", err);
    }
  }

  fallbackStore.licenses.unshift(license);
  return license;
}

export async function approveLicense(key: string): Promise<ProLicense | null> {
  const cleanKey = key.trim().toUpperCase();
  const db = getD1();
  const now = Date.now();

  if (db) {
    try {
      const row: any = await db
        .prepare("SELECT * FROM omnisaver_licenses WHERE license_key = ? COLLATE NOCASE")
        .bind(cleanKey)
        .first();

      if (row) {
        const plan = (row.plan_type as ProPlanType) || "monthly";
        const durationDays = plan === "monthly" ? 30 : plan === "quarterly" ? 90 : 365;
        const fullExpiry = now + durationDays * 24 * 60 * 60 * 1000;

        await db
          .prepare("UPDATE omnisaver_licenses SET status = 'active', expires_at = ? WHERE id = ?")
          .bind(fullExpiry, row.id)
          .run();

        return {
          id: row.id,
          key: row.license_key,
          deviceId: row.device_id,
          planType: row.plan_type,
          pricePkr: Number(row.amount_pkr) || 0,
          status: "active",
          issuedAt: new Date(row.created_at).toISOString(),
          expiresAt: fullExpiry,
          notes: row.tid_notes,
          tid: row.tid_notes,
        };
      }
    } catch (err) {
      console.warn("[D1 approveLicense error]", err);
    }
  }

  const lic = fallbackStore.licenses.find((l) => l.key.toUpperCase() === cleanKey);
  if (!lic) return null;
  const durationDays = lic.planType === "monthly" ? 30 : lic.planType === "quarterly" ? 90 : 365;
  lic.expiresAt = now + durationDays * 24 * 60 * 60 * 1000;
  lic.status = "active";
  return lic;
}

export async function extendLicense(key: string, days: number = 30): Promise<ProLicense | null> {
  const cleanKey = key.trim().toUpperCase();
  const db = getD1();
  const now = Date.now();

  if (db) {
    try {
      const row: any = await db
        .prepare("SELECT * FROM omnisaver_licenses WHERE license_key = ? COLLATE NOCASE")
        .bind(cleanKey)
        .first();

      if (row) {
        const base = Number(row.expires_at) > now ? Number(row.expires_at) : now;
        const newExpiry = base + days * 24 * 60 * 60 * 1000;

        await db
          .prepare("UPDATE omnisaver_licenses SET expires_at = ?, status = 'active' WHERE id = ?")
          .bind(newExpiry, row.id)
          .run();

        return {
          id: row.id,
          key: row.license_key,
          deviceId: row.device_id,
          planType: row.plan_type,
          pricePkr: Number(row.amount_pkr) || 0,
          status: "active",
          issuedAt: new Date(row.created_at).toISOString(),
          expiresAt: newExpiry,
          notes: row.tid_notes,
        };
      }
    } catch (err) {
      console.warn("[D1 extendLicense error]", err);
    }
  }

  const lic = fallbackStore.licenses.find((l) => l.key.toUpperCase() === cleanKey);
  if (!lic) return null;
  const baseTime = lic.expiresAt > now ? lic.expiresAt : now;
  lic.expiresAt = baseTime + days * 24 * 60 * 60 * 1000;
  lic.status = "active";
  return lic;
}

export async function revokeLicense(key: string): Promise<ProLicense | null> {
  const cleanKey = key.trim().toUpperCase();
  const db = getD1();

  if (db) {
    try {
      const row: any = await db
        .prepare("SELECT * FROM omnisaver_licenses WHERE license_key = ? COLLATE NOCASE")
        .bind(cleanKey)
        .first();

      if (row) {
        await db
          .prepare("UPDATE omnisaver_licenses SET status = 'revoked', expires_at = ? WHERE id = ?")
          .bind(Date.now(), row.id)
          .run();

        return {
          id: row.id,
          key: row.license_key,
          deviceId: row.device_id,
          planType: row.plan_type,
          pricePkr: Number(row.amount_pkr) || 0,
          status: "revoked",
          issuedAt: new Date(row.created_at).toISOString(),
          expiresAt: Date.now(),
          notes: row.tid_notes,
        };
      }
    } catch (err) {
      console.warn("[D1 revokeLicense error]", err);
    }
  }

  const lic = fallbackStore.licenses.find((l) => l.key.toUpperCase() === cleanKey);
  if (!lic) return null;
  lic.status = "revoked";
  lic.expiresAt = Date.now();
  return lic;
}

export async function verifyLicense(
  key: string,
  deviceId: string
): Promise<{ valid: boolean; planType?: ProPlanType; expiresAt?: number; status?: "active" | "pending"; error?: string }> {
  const cleanKey = key.trim().toUpperCase();
  const cleanDev = deviceId.trim().toUpperCase();
  const now = Date.now();

  const db = getD1();
  if (db) {
    try {
      const row: any = await db
        .prepare("SELECT * FROM omnisaver_licenses WHERE license_key = ? COLLATE NOCASE")
        .bind(cleanKey)
        .first();

      if (!row) {
        return { valid: false, error: "Invalid license key. Please check the code and try again." };
      }

      if (row.status !== "active" && row.status !== "pending") {
        return { valid: false, error: "This license key has been revoked or expired." };
      }

      if (now > Number(row.expires_at)) {
        await db.prepare("UPDATE omnisaver_licenses SET status = 'revoked' WHERE id = ?").bind(row.id).run();
        return {
          valid: false,
          error: row.status === "pending"
            ? "The 24-hour grace period for this TID has expired."
            : "This license key has expired.",
        };
      }

      // If license has no bound device, bind to current device
      if (!row.device_id || row.device_id.trim() === "") {
        await db.prepare("UPDATE omnisaver_licenses SET device_id = ? WHERE id = ?").bind(cleanDev, row.id).run();
      } else if (row.device_id.toUpperCase() !== cleanDev) {
        return {
          valid: false,
          error: `License key is bound to another device (${row.device_id}). Each PRO key is locked to one device.`,
        };
      }

      return {
        valid: true,
        planType: row.plan_type as ProPlanType,
        expiresAt: Number(row.expires_at),
        status: row.status as "active" | "pending",
      };
    } catch (err) {
      console.warn("[D1 verifyLicense error, falling back]", err);
    }
  }

  // Fallback verification
  const lic = fallbackStore.licenses.find((l) => l.key.toUpperCase() === cleanKey);
  if (!lic) {
    return { valid: false, error: "Invalid license key. Please check the code and try again." };
  }
  if (lic.status !== "active" && lic.status !== "pending") {
    return { valid: false, error: "This license key has been revoked or expired." };
  }
  if (now > lic.expiresAt) {
    const wasPending = lic.status === "pending";
    lic.status = "revoked";
    return {
      valid: false,
      error: wasPending
        ? "The 24-hour grace period for this TID has expired."
        : "This license key has expired.",
    };
  }
  if (!lic.deviceId || lic.deviceId.trim() === "") {
    lic.deviceId = cleanDev;
  } else if (lic.deviceId.toUpperCase() !== cleanDev) {
    return {
      valid: false,
      error: `License key is bound to another device (${lic.deviceId}). Each PRO key is locked to one device.`,
    };
  }
  return {
    valid: true,
    planType: lic.planType,
    expiresAt: lic.expiresAt,
    status: lic.status as "active" | "pending",
  };
}

// Automated In-App Activation via Transaction ID (TID) or License Key with 24-Hour Grace Period
export async function activateByTidOrKey(params: {
  code: string;
  deviceId: string;
  planType?: ProPlanType;
  senderPhone?: string;
}): Promise<{ valid: boolean; planType?: ProPlanType; expiresAt?: number; status?: "active" | "pending"; error?: string; message?: string }> {
  const cleanCode = (params.code || "").trim().toUpperCase();
  const cleanDev = (params.deviceId || "").trim().toUpperCase();
  const plan = params.planType || "quarterly";
  const now = Date.now();

  if (!cleanCode) {
    return { valid: false, error: "Transaction ID or License Code is required." };
  }

  // 1. Check if it matches an existing active license or VIP promo code stored in D1
  const directVerify = await verifyLicense(cleanCode, cleanDev);
  if (directVerify.valid) {
    return {
      ...directVerify,
      message: directVerify.status === "pending"
        ? "24-Hour Grace PRO is active while payment receipt is pending verification."
        : "PRO License Activated Successfully!",
    };
  }

  // 2. Automated Transaction ID (TID) Verification with Pending Status & 24h Grace
  const cleanTid = cleanCode.replace(/[^A-Z0-9-]/g, "");
  if (cleanTid.length >= 6) {
    const db = getD1();
    if (db) {
      try {
        const existing: any = await db
          .prepare("SELECT * FROM omnisaver_licenses WHERE tid_notes LIKE ? OR license_key = ? COLLATE NOCASE")
          .bind(`%${cleanTid}%`, cleanTid)
          .first();

        if (existing) {
          if (
            existing.device_id.toUpperCase() === cleanDev &&
            (existing.status === "active" || existing.status === "pending") &&
            now < Number(existing.expires_at)
          ) {
            return {
              valid: true,
              planType: existing.plan_type,
              expiresAt: Number(existing.expires_at),
              status: existing.status,
              message: existing.status === "pending"
                ? "24-Hour Grace PRO is currently active for this TID while verification completes."
                : "PRO License Restored for this device!",
            };
          }
          return {
            valid: false,
            error: "This Transaction ID (TID) has already been used.",
          };
        }
      } catch (_) {}
    }

    // Check fallbackStore as well
    const fallbackExisting = fallbackStore.licenses.find(
      (l) =>
        (l.tid && l.tid.toUpperCase().includes(cleanTid)) ||
        (l.notes && l.notes.toUpperCase().includes(cleanTid)) ||
        l.key.toUpperCase() === cleanTid
    );
    if (fallbackExisting) {
      if (
        fallbackExisting.deviceId.toUpperCase() === cleanDev &&
        (fallbackExisting.status === "active" || fallbackExisting.status === "pending") &&
        now < fallbackExisting.expiresAt
      ) {
        return {
          valid: true,
          planType: fallbackExisting.planType,
          expiresAt: fallbackExisting.expiresAt,
          status: fallbackExisting.status,
          message: fallbackExisting.status === "pending"
            ? "24-Hour Grace PRO is active while verification completes."
            : "PRO License Restored!",
        };
      }
      return {
        valid: false,
        error: "This Transaction ID (TID) has already been used.",
      };
    }

    // New valid-looking TID: grant 24-hour grace period!
    const graceHours = 24;
    const expiresAt = now + graceHours * 60 * 60 * 1000;
    const pricing = DEFAULT_CONFIG.proPricing;
    const amount = plan === "monthly" ? pricing.monthly : plan === "quarterly" ? pricing.quarterly : pricing.yearly;

    await createLicense({
      deviceId: cleanDev,
      planType: plan,
      pricePkr: amount,
      tid: cleanTid,
      notes: `TID: ${cleanTid}${params.senderPhone ? ` (Phone: ${params.senderPhone})` : ""}`,
      status: "pending",
      expiresAt,
    });

    return {
      valid: true,
      planType: plan,
      expiresAt,
      status: "pending",
      message: "TID submitted! Instant 24-hour Grace PRO activated while payment is verified.",
    };
  }

  return {
    valid: false,
    error: "Invalid Transaction ID. Please enter your 6-12 digit EasyPaisa/JazzCash TID or a valid PRO key.",
  };
}

// ──────────────────────────────────────────
// 3. REMOTE CONFIG MANAGEMENT
// ──────────────────────────────────────────

export async function getAppConfig(): Promise<AppRemoteConfig> {
  const db = getD1();
  if (db) {
    try {
      const row: any = await db.prepare("SELECT * FROM omnisaver_config WHERE id = 1").first();
      if (row) {
        let paymentDetails = DEFAULT_CONFIG.paymentDetails;
        let releaseNotes = DEFAULT_CONFIG.versionConfig.releaseNotes;

        try {
          if (row.payment_accounts) paymentDetails = JSON.parse(row.payment_accounts);
        } catch (_) {}

        try {
          if (row.release_notes) releaseNotes = JSON.parse(row.release_notes);
        } catch (_) {}

        return {
          paymentDetails: {
            easypaisa: paymentDetails.easypaisa || DEFAULT_CONFIG.paymentDetails.easypaisa,
            nayapay: paymentDetails.nayapay || DEFAULT_CONFIG.paymentDetails.nayapay,
            bankIban: paymentDetails.bankIban || DEFAULT_CONFIG.paymentDetails.bankIban,
            whatsappNumber: row.whatsapp_number || DEFAULT_CONFIG.paymentDetails.whatsappNumber,
          },
          adConfig: {
            adsEnabled: row.ads_enabled === 1,
            bannerEnabled: row.banner_enabled === 1,
            interstitialEnabled: row.interstitial_enabled === 1,
            rewardedEnabled: row.rewarded_enabled === 1,
            interstitialInterval: Number(row.interstitial_frequency) || 2,
            admobBannerId: DEFAULT_CONFIG.adConfig.admobBannerId,
            admobInterstitialId: DEFAULT_CONFIG.adConfig.admobInterstitialId,
            admobRewardedId: DEFAULT_CONFIG.adConfig.admobRewardedId,
          },
          versionConfig: {
            latestVersion: row.latest_version || DEFAULT_CONFIG.versionConfig.latestVersion,
            versionCode: 10016,
            apkDownloadUrl: row.apk_download_url || DEFAULT_CONFIG.versionConfig.apkDownloadUrl,
            forceUpdate: row.force_update === 1,
            releaseNotes,
          },
          proPricing: DEFAULT_CONFIG.proPricing,
        };
      }
    } catch (err) {
      console.warn("[D1 getAppConfig error]", err);
    }
  }

  return fallbackStore.config;
}

export async function updateAppConfig(partial: Partial<AppRemoteConfig>): Promise<AppRemoteConfig> {
  const current = await getAppConfig();
  const merged: AppRemoteConfig = {
    ...current,
    ...partial,
    paymentDetails: { ...current.paymentDetails, ...(partial.paymentDetails || {}) },
    adConfig: { ...current.adConfig, ...(partial.adConfig || {}) },
    versionConfig: { ...current.versionConfig, ...(partial.versionConfig || {}) },
    proPricing: { ...current.proPricing, ...(partial.proPricing || {}) },
  };

  const db = getD1();
  if (db) {
    try {
      await db
        .prepare(
          `INSERT INTO omnisaver_config (
            id, latest_version, apk_download_url, force_update, release_notes,
            ads_enabled, banner_enabled, interstitial_enabled, rewarded_enabled,
            interstitial_frequency, payment_accounts, whatsapp_number, updated_at
          ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            latest_version = excluded.latest_version,
            apk_download_url = excluded.apk_download_url,
            force_update = excluded.force_update,
            release_notes = excluded.release_notes,
            ads_enabled = excluded.ads_enabled,
            banner_enabled = excluded.banner_enabled,
            interstitial_enabled = excluded.interstitial_enabled,
            rewarded_enabled = excluded.rewarded_enabled,
            interstitial_frequency = excluded.interstitial_frequency,
            payment_accounts = excluded.payment_accounts,
            whatsapp_number = excluded.whatsapp_number,
            updated_at = excluded.updated_at`
        )
        .bind(
          merged.versionConfig.latestVersion,
          merged.versionConfig.apkDownloadUrl,
          merged.versionConfig.forceUpdate ? 1 : 0,
          JSON.stringify(merged.versionConfig.releaseNotes),
          merged.adConfig.adsEnabled ? 1 : 0,
          merged.adConfig.bannerEnabled ? 1 : 0,
          merged.adConfig.interstitialEnabled ? 1 : 0,
          merged.adConfig.rewardedEnabled ? 1 : 0,
          merged.adConfig.interstitialInterval,
          JSON.stringify(merged.paymentDetails),
          merged.paymentDetails.whatsappNumber,
          Date.now()
        )
        .run();
    } catch (err) {
      console.warn("[D1 updateAppConfig error]", err);
    }
  }

  fallbackStore.config = merged;
  return merged;
}
