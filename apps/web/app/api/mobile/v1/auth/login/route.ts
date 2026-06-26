import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeIndianPhone, verifyLatestOtp } from "@/lib/otp";
import { generateAccessToken, generateRefreshToken, hashRefreshToken } from "@/lib/mobile-auth";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const phoneLoginSchema = z.object({
  phone: z.string().min(8),
  otp: z.string().length(6),
  deviceId: z.string().min(1),
  platform: z.enum(["android", "ios"]).default("android"),
});

const emailLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().min(1),
  platform: z.enum(["android", "ios"]).default("android"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  // Determine login method
  const isPhoneLogin = "phone" in body && "otp" in body;
  const isEmailLogin = "email" in body && "password" in body;

  if (!isPhoneLogin && !isEmailLogin) {
    return NextResponse.json({ error: "Provide phone+otp or email+password" }, { status: 400 });
  }

  const rateLimitKey = isPhoneLogin
    ? `mobile-login:phone:${body.phone}`
    : `mobile-login:email:${body.email}`;
  const limit = await enforceRateLimit(rateLimitKey, 10, 600);
  if (limit.limited) return rateLimitResponse(limit.reset);

  if (isPhoneLogin) {
    const parsed = phoneLoginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid login data" }, { status: 400 });

    const { phone, otp, deviceId, platform } = parsed.data;
    const normalizedPhone = normalizeIndianPhone(phone);

    const verified = await verifyLatestOtp(normalizedPhone, otp);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true, name: true, role: true, phone: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Account not found or inactive" }, { status: 401 });
    }

    return issueTokens(user, deviceId, platform);
  }

  // Email + password login
  const parsed = emailLoginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid login data" }, { status: 400 });

  const { email, password, deviceId, platform } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, role: true, phone: true, isActive: true, passwordHash: true, lockedUntil: true },
  });

  if (!user || !user.passwordHash || !user.isActive) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json({ error: "Account locked. Try again later." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return issueTokens(
    { id: user.id, name: user.name, role: user.role, phone: user.phone },
    deviceId,
    platform
  );
}

async function issueTokens(
  user: { id: string; name: string | null; role: string; phone: string | null },
  deviceId: string,
  platform: string
) {
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken();
  const tokenHash = await hashRefreshToken(refreshToken);

  await prisma.mobileRefreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      deviceId,
      platform,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return NextResponse.json({
    accessToken,
    refreshToken,
    expiresIn: 900,
    user: { id: user.id, name: user.name, role: user.role, phone: user.phone },
  });
}
