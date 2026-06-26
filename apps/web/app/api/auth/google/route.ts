import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken, hashRefreshToken } from "@/lib/mobile-auth";
import { mobileJson, mobileOptionsResponse } from "@/lib/mobile-cors";

const ACCESS_TOKEN_EXPIRES_IN = 900;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const GOOGLE_CLIENT_IDS = new Set(
  [
    process.env.GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    "47754236417-n3n1a2395t9mcm1hfg6rsvqkehj1icgh.apps.googleusercontent.com",
    "47754236417-8aerlthrl09j4va69d620212u47ocpvh.apps.googleusercontent.com",
    "47754236417-2maistb30ua41m3dm5h2sf8jqit8onlh.apps.googleusercontent.com",
  ].filter(Boolean)
);

const googleLoginSchema = z.object({
  idToken: z.string().min(1),
  deviceId: z.string().min(1).default("expo-web"),
  platform: z.enum(["android", "ios", "web"]).default("web"),
});

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
};

export async function OPTIONS(request: Request) {
  return mobileOptionsResponse(request);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = googleLoginSchema.safeParse(body);

  if (!parsed.success) {
    return mobileJson(request, { error: "Invalid Google sign-in request" }, { status: 400 });
  }

  const { idToken, deviceId, platform } = parsed.data;
  const tokenResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    { cache: "no-store" }
  );

  if (!tokenResponse.ok) {
    return mobileJson(request, { error: "Invalid Google token" }, { status: 401 });
  }

  const tokenInfo = (await tokenResponse.json()) as GoogleTokenInfo;
  const audience = String(tokenInfo.aud ?? "");
  const email = String(tokenInfo.email ?? "").toLowerCase();
  const emailVerified = tokenInfo.email_verified === true || tokenInfo.email_verified === "true";

  if (!GOOGLE_CLIENT_IDS.has(audience) || !email || !emailVerified) {
    return mobileJson(request, { error: "Google account could not be verified" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      emailVerified: new Date(),
      image: tokenInfo.picture || null,
      name: tokenInfo.name || null,
      role: "CUSTOMER",
      isActive: true,
      lastLoginAt: new Date(),
    },
    update: {
      emailVerified: new Date(),
      image: tokenInfo.picture || undefined,
      name: tokenInfo.name || undefined,
      lastLoginAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      image: true,
    },
  });

  if (!user.isActive) {
    return mobileJson(request, { error: "Account is inactive" }, { status: 401 });
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken();
  const tokenHash = await hashRefreshToken(refreshToken);

  await prisma.mobileRefreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      deviceId,
      platform,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return mobileJson(request, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      image: user.image,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}
