import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional()
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile details." }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: { id: true, name: true, email: true }
  });
  await writeAuditLog({
    actorId: session.user.id,
    actorRole: session.user.role,
    action: "profile_updated",
    targetType: "User",
    targetId: session.user.id
  });
  return NextResponse.json({ user });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: { userId: session.user.id },
      data: { userId: null }
    });
    await tx.user.delete({ where: { id: session.user.id } });
  });

  await writeAuditLog({
    actorId: null,
    actorRole: session.user.role,
    action: "account_deleted",
    targetType: "User",
    targetId: session.user.id
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
