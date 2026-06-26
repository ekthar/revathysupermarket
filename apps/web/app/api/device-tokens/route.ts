import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  token: z.string().min(10).max(500),
  platform: z.enum(["web", "android", "ios"]).default("web"),
});

const deleteSchema = z.object({
  token: z.string().min(10).max(500),
});

/**
 * POST /api/device-tokens - Register an FCM device token for the current user
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const { token, platform } = parsed.data;
  const installationId = `web-${token.slice(-16)}`;

  await prisma.deviceToken.upsert({
    where: {
      userId_installationId: {
        userId: session.user.id,
        installationId,
      },
    },
    create: {
      userId: session.user.id,
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

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/device-tokens - Remove an FCM device token (e.g., on logout)
 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  await prisma.deviceToken.deleteMany({
    where: {
      userId: session.user.id,
      token: parsed.data.token,
    },
  });

  return NextResponse.json({ ok: true });
}
