import { NextRequest, NextResponse } from "next/server";
import { getAppConfig, updateAppConfig } from "@/app/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getAppConfig();
  return NextResponse.json(config, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const updated = await updateAppConfig(body);
    return NextResponse.json({ success: true, config: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update config";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
