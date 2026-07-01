import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const LOYALTY_KEYS = [
  "loyalty_earn_rate",
  "loyalty_point_value",
  "loyalty_max_redemption_percent",
];

/**
 * GET /api/mobile/v1/admin/rewards
 * Returns loyalty configuration from Settings.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const settings = await prisma.setting.findMany({
    where: { key: { in: LOYALTY_KEYS } },
  });

  const config: Record<string, string> = {};
  for (const s of settings) {
    config[s.key] = s.value;
  }

  return NextResponse.json({ data: config });
}

/**
 * PATCH /api/mobile/v1/admin/rewards
 * Update loyalty configuration settings.
 */
export async function PATCH(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  if (!["ADMIN", "OWNER"].includes(auth.role)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const updates: { key: string; value: string }[] = [];

  for (const key of LOYALTY_KEYS) {
    if (body[key] !== undefined) {
      updates.push({ key, value: String(body[key]) });
    }
  }

  for (const { key, value } of updates) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  return NextResponse.json({ success: true });
}
