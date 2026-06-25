import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest, compareRefreshToken } from "@/lib/mobile-auth";

const logoutSchema = z.union([
  z.object({ refreshToken: z.string().min(1), deviceId: z.string().min(1) }),
  z.object({ allDevices: z.literal(true) }),
]);

export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = logoutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid logout data" }, { status: 400 });

  if ("allDevices" in parsed.data && parsed.data.allDevices === true) {
    // Revoke all refresh tokens for this user
    await prisma.mobileRefreshToken.updateMany({
      where: { userId: auth.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    // Delete all device tokens for this user
    await prisma.deviceToken.deleteMany({
      where: { userId: auth.userId },
    });
  } else if ("refreshToken" in parsed.data) {
    // Single-device logout: find and revoke only the matching token
    const { refreshToken, deviceId } = parsed.data;

    const candidates = await prisma.mobileRefreshToken.findMany({
      where: { userId: auth.userId, deviceId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    for (const candidate of candidates) {
      const matches = await compareRefreshToken(refreshToken, candidate.tokenHash);
      if (matches) {
        await prisma.mobileRefreshToken.update({
          where: { id: candidate.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }

    // Also remove the device token registration for this device
    await prisma.deviceToken.deleteMany({
      where: { userId: auth.userId, installationId: deviceId },
    }).catch(() => null);
  }

  return NextResponse.json({ success: true });
}
