import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken, hashRefreshToken, compareRefreshToken } from "@/lib/mobile-auth";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
  deviceId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = refreshSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid refresh data" }, { status: 400 });

  const { refreshToken, deviceId } = parsed.data;

  const limit = await enforceRateLimit(`mobile-refresh:${deviceId}`, 20, 600);
  if (limit.limited) return rateLimitResponse(limit.reset);

  // Find all non-revoked, non-expired tokens for this device
  const candidates = await prisma.mobileRefreshToken.findMany({
    where: {
      deviceId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  // Check each candidate against the provided token
  let matchedToken: typeof candidates[0] | null = null;
  for (const candidate of candidates) {
    const matches = await compareRefreshToken(refreshToken, candidate.tokenHash);
    if (matches) {
      matchedToken = candidate;
      break;
    }
  }

  if (!matchedToken) {
    return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
  }

  // Revoke old token (rotation)
  await prisma.mobileRefreshToken.update({
    where: { id: matchedToken.id },
    data: { revokedAt: new Date() },
  });

  // Get user info for new access token
  const user = await prisma.user.findUnique({
    where: { id: matchedToken.userId },
    select: { id: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Account inactive" }, { status: 401 });
  }

  // Issue new tokens
  const newAccessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken();
  const newTokenHash = await hashRefreshToken(newRefreshToken);

  await prisma.mobileRefreshToken.create({
    data: {
      userId: user.id,
      tokenHash: newTokenHash,
      deviceId,
      platform: matchedToken.platform,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 900,
  });
}
