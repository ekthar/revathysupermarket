import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireOwner } from "@/lib/authz";
import { staffSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const unauthorized = requireOwner(session);
    if (unauthorized) return unauthorized;

    const body = await request.json();
    const parsed = staffSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join(".");
      return NextResponse.json({ error: field ? `${field}: ${issue.message}` : "Invalid staff details." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });

    const staff = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        role: parsed.data.role,
        vehicleInfo: parsed.data.vehicleInfo || null,
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }
    console.error("Staff create failed", error);
    return NextResponse.json({ error: "Staff account could not be created." }, { status: 500 });
  }
}
