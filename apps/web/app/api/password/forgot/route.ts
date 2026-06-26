import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { forgotPasswordSchema } from "@/lib/validations";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { clientIp } from "@/lib/request-security";

export async function POST(request: Request) {
  const limit = await enforceRateLimit(`password-forgot:${clientIp(request)}`, 5, 900);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return NextResponse.json({ ok: true });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashPasswordResetToken(token),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });

  return NextResponse.json({
    ok: true,
    note: "Email/SMS delivery is not configured; in production send this single-use token through the chosen provider.",
    resetUrl: process.env.NODE_ENV === "production" ? undefined : `/forgot-password?token=${token}`
  });
}
