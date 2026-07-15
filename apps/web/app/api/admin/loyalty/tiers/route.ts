import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";

export async function GET() {
  const result = await requirePermission("settings.manage");
  if ("error" in result) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const row = await prisma.setting.findUnique({ where: { key: "loyaltyTiers" } });
    if (row) {
      return NextResponse.json({ tiers: JSON.parse(row.value) });
    }
    // Default tiers
    return NextResponse.json({
      tiers: [
        { name: "Bronze", min: 0, max: 199 },
        { name: "Silver", min: 200, max: 499 },
        { name: "Gold", min: 500, max: 99999 },
      ],
    });
  } catch {
    return NextResponse.json({ tiers: [] }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const result = await requirePermission("settings.manage");
  if ("error" in result) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { tiers } = body as { tiers: Array<{ name: string; min: number; max: number }> };

  if (!Array.isArray(tiers) || tiers.length === 0) {
    return NextResponse.json({ error: "At least one tier is required" }, { status: 400 });
  }

  try {
    await prisma.setting.upsert({
      where: { key: "loyaltyTiers" },
      update: { value: JSON.stringify(tiers) },
      create: { key: "loyaltyTiers", value: JSON.stringify(tiers) },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save tiers" }, { status: 500 });
  }
}
