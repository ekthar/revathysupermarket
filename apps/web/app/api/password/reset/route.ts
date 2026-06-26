import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { resetPasswordSchema } from "@/lib/validations";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { clientIp } from "@/lib/request-security";

export async function POST(request: Request) {
  const limit = await enforceRateLimit(`password-reset:${clientIp(request)}`, 10, 900);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const body = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid reset details." }, { status: 400 });

  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashPasswordResetToken(parsed.data.token) } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "Reset token is invalid or expired." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: reset.userId },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      passwordVersion: { increment: 1 },
      failedLoginAttempts: 0,
      lockedUntil: null
    }
  });
  await prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
  await prisma.session.deleteMany({ where: { userId: reset.userId } });
  await writeAuditLog({
    actorId: reset.userId,
    actorRole: "CUSTOMER",
    action: "password_reset",
    targetType: "User",
    targetId: reset.userId
  });

  return NextResponse.json({ ok: true });
}
