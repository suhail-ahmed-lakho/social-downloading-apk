import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const latestApkUrl =
    "https://github.com/suhail-ahmed-lakho/social-downloading-apk/releases/latest/download/OmniSaver-latest.apk";
  return NextResponse.redirect(latestApkUrl, 302);
}
