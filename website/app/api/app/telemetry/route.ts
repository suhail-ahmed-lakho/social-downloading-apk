import { NextRequest, NextResponse } from "next/server";
import { recordEvent } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    const country = req.headers.get("cf-ipcountry") || "Mobile Client";
    const city = req.headers.get("cf-ipcity") || "";

    const body: any = await req.json().catch(() => ({}));
    const {
      source = "mobile_app",
      action = "heartbeat",
      platform,
      deviceId,
      isPro = false,
      details = "Mobile App Activity",
      appVersion = "1.0.16",
    } = body;

    await recordEvent({
      source: source === "website" ? "website" : "mobile_app",
      action,
      platform,
      deviceId: deviceId ? String(deviceId).trim().toUpperCase() : undefined,
      isPro: Boolean(isPro),
      ip,
      country,
      city,
      device: "Android App",
      browser: `OmniSaver v${appVersion}`,
      status: "SUCCESS",
      details,
      metadata: body.metadata,
    });

    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Telemetry failed";
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
