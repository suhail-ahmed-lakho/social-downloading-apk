import { NextRequest, NextResponse } from "next/server";
import { logActivity, parseDevice, isIPBlocked } from "@/app/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    if (isIPBlocked(ip)) {
      return NextResponse.json({ error: "Access Denied by Security Firewall" }, { status: 403 });
    }

    const country = req.headers.get("cf-ipcountry") || "Global";
    const city = req.headers.get("cf-ipcity") || "Visitor City";
    const userAgent = req.headers.get("user-agent") || "";
    const parsed = parseDevice(userAgent);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty on simple beacon
    }

    const device = body.device || parsed.device;
    const browser = body.browser || (body.appVersion ? `OmniSaver App v${body.appVersion}` : parsed.browser);
    const platform = body.platform || (body.isApp ? "mobile-app" : "web");
    const action = (body.action as any) || "visit";
    const details = body.details || `Visited: ${body.path || "/"}`;
    const userName = body.name || (city && city !== "Visitor City" ? `User from ${city}` : `App User (${ip.slice(0, 7)}...)`);
    const userEmail = body.email || undefined;

    logActivity({
      ip,
      country,
      city,
      userName,
      userEmail,
      device,
      browser,
      platform,
      action,
      details,
      status: "SUCCESS",
    });

    return NextResponse.json({ success: true, ip, country, city, device, browser });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Tracking failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
