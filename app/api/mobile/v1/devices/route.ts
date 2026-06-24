import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const registerDeviceSchema = z.object({
  installationId: z.string().min(1),
  platform: z.enum(["android", "ios"]),
  token: z.string().min(1),
});

export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = registerDeviceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid device data" }, { status: 400 });

  const { installationId, platform, token } = parsed.data;

  const device = await prisma.deviceToken.upsert({
    where: { userId_installationId: { userId: auth.userId, installationId } },
    create: {
      userId: auth.userId,
      installationId,
      platform,
      token,
      lastSeenAt: new Date(),
    },
    update: {
      token,
      platform,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({ device: { id: device.id, installationId: device.installationId, platform: device.platform } });
}

export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const devices = await prisma.deviceToken.findMany({
    where: { userId: auth.userId },
    select: { id: true, installationId: true, platform: true, lastSeenAt: true },
    orderBy: { lastSeenAt: "desc" },
  });

  return NextResponse.json({ devices });
}
