import { NextRequest, NextResponse } from "next/server";
import { listLicenses, createLicense, extendLicense, revokeLicense, approveLicense } from "@/app/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const licenses = await listLicenses();
  return NextResponse.json({ success: true, licenses });
}

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { action } = body;

    if (action === "create") {
      const { deviceId, planType, pricePkr, notes, tid } = body;
      if (!deviceId || !planType) {
        return NextResponse.json({ error: "Device ID and Plan Type are required" }, { status: 400 });
      }

      const license = await createLicense({
        deviceId,
        planType,
        pricePkr,
        notes,
        tid,
      });

      const allLicenses = await listLicenses();
      return NextResponse.json({ success: true, license, licenses: allLicenses });
    }

    if (action === "extend") {
      const { key, days = 30 } = body;
      if (!key) return NextResponse.json({ error: "License key is required" }, { status: 400 });

      const updated = await extendLicense(key, Number(days) || 30);
      if (!updated) return NextResponse.json({ error: "License not found" }, { status: 404 });

      const allLicenses = await listLicenses();
      return NextResponse.json({ success: true, license: updated, licenses: allLicenses });
    }

    if (action === "approve") {
      const { key } = body;
      if (!key) return NextResponse.json({ error: "License key is required" }, { status: 400 });

      const updated = await approveLicense(key);
      if (!updated) return NextResponse.json({ error: "License not found" }, { status: 404 });

      const allLicenses = await listLicenses();
      return NextResponse.json({ success: true, license: updated, licenses: allLicenses });
    }

    if (action === "reject") {
      const { key } = body;
      if (!key) return NextResponse.json({ error: "License key is required" }, { status: 400 });

      const updated = await revokeLicense(key);
      if (!updated) return NextResponse.json({ error: "License not found" }, { status: 404 });

      const allLicenses = await listLicenses();
      return NextResponse.json({ success: true, license: updated, licenses: allLicenses });
    }

    if (action === "revoke") {
      const { key } = body;
      if (!key) return NextResponse.json({ error: "License key is required" }, { status: 400 });

      const updated = await revokeLicense(key);
      if (!updated) return NextResponse.json({ error: "License not found" }, { status: 404 });

      const allLicenses = await listLicenses();
      return NextResponse.json({ success: true, license: updated, licenses: allLicenses });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "License operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
