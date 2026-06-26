import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeIndianPhone, verifyLatestOtp } from "@/lib/otp";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({
  phone: z.string().min(10),
  otp: z.string().regex(/^\d{6}$/)
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the phone and 6-digit OTP." }, { status: 400 });

  const phone = normalizeIndianPhone(parsed.data.phone);
  const existing = await prisma.user.findFirst({
    where: { phone, NOT: { id: session.user.id } },
    select: { id: true }
  });
  if (existing) return NextResponse.json({ error: "This phone number is already linked to another account." }, { status: 409 });

  const verified = await verifyLatestOtp(phone, parsed.data.otp);
  if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { phone, phoneVerified: true },
    select: { id: true, phone: true }
  });
  await writeAuditLog({
    actorId: session.user.id,
    actorRole: session.user.role,
    action: "phone_linked",
    targetType: "User",
    targetId: session.user.id
  });
  return NextResponse.json({ user });
}
