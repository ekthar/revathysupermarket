import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireOwner } from "@/lib/authz";
import { staffSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  const unauthorized = requireOwner(session);
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const parsed = staffSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid staff details." }, { status: 400 });

  const staff = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: parsed.data.role,
      vehicleInfo: parsed.data.vehicleInfo,
      passwordHash: await bcrypt.hash(parsed.data.password, 12)
    },
    select: { id: true }
  });
  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "staff_created",
    targetType: "User",
    targetId: staff.id,
    metadata: { role: parsed.data.role }
  });

  return NextResponse.json({ staff });
}
