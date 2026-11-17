import { NextRequest, NextResponse } from "next/server";
import { verifyLicense, recordEvent } from "@/app/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    const body: any = await req.json();
    const { key, deviceId } = body;

    if (!key || typeof key !== "string" || !deviceId || typeof deviceId !== "string") {
      return NextResponse.json(
        { valid: false, error: "License key and Device ID are both required" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
          },
        }
      );
    }

    const result = await verifyLicense(key, deviceId);

    // Record telemetry event asynchronously
    await recordEvent({
      source: "mobile_app",
      action: "login",
      deviceId: deviceId.trim().toUpperCase(),
      isPro: result.valid,
      ip,
      country: req.headers.get("cf-ipcountry") || "Mobile Client",
      city: req.headers.get("cf-ipcity") || "",
      device: "Android App",
      browser: "OmniSaver Mobile",
      status: result.valid ? "SUCCESS" : "FAILED",
      details: result.valid
        ? `Activated PRO License (${result.planType})`
        : `License verification failed: ${result.error}`,
      metadata: { key, deviceId },
    });

    return NextResponse.json(
      {
        valid: result.valid,
        planType: result.planType,
        expiresAt: result.expiresAt,
        error: result.error,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "License verification failed";
    return NextResponse.json(
      { valid: false, error: message },
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
