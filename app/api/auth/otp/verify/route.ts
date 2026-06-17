import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyLatestOtp } from "@/lib/otp";

const schema = z.object({
  phone: z.string().min(10),
  otp: z.string().regex(/^\d{6}$/),
  name: z.string().min(2).optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit verification code." }, { status: 400 });

  const verified = await verifyLatestOtp(parsed.data.phone, parsed.data.otp);
  if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: 400 });

  const user = await prisma.user.upsert({
    where: { phone: verified.phone },
    create: {
      phone: verified.phone,
      phoneVerified: true,
      name: parsed.data.name,
      role: "CUSTOMER",
      lastLoginAt: new Date()
    },
    update: {
      phoneVerified: true,
      name: parsed.data.name,
      lastLoginAt: new Date()
    },
    select: { id: true, name: true, phone: true }
  });

  return NextResponse.json({ success: true, user });
}
