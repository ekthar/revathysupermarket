import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";

const schema = z.object({
  name: z.string().min(1).max(50),
});

const defaultUnits = [
  "pcs",
  "10 nos",
  "kg",
  "500 g",
  "250 g",
  "100 g",
  "L",
  "500 ml",
  "250 ml",
  "packet",
  "box",
  "bundle",
];

export async function GET() {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;

  let count = await prisma.unit.count();
  if (count === 0) {
    // Seed initial default units
    await prisma.unit.createMany({
      data: defaultUnits.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  const units = await prisma.unit.findMany({
    orderBy: { name: "asc" },
  });

  // Include product count using each unit string dynamically
  const unitsWithCounts = await Promise.all(
    units.map(async (unit) => {
      const productCount = await prisma.product.count({
        where: { unit: unit.name },
      });
      return {
        ...unit,
        productCount,
      };
    })
  );

  return NextResponse.json({ units: unitsWithCounts });
}

export async function POST(request: Request) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid unit name." }, { status: 400 });
  }

  const normalizedName = parsed.data.name.trim();

  // Check if name already exists
  const existing = await prisma.unit.findUnique({
    where: { name: normalizedName },
  });
  if (existing) {
    return NextResponse.json({ error: "Unit name already exists." }, { status: 409 });
  }

  const unit = await prisma.unit.create({
    data: { name: normalizedName },
  });

  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "unit_created",
    targetType: "Unit",
    targetId: unit.id,
    metadata: { name: unit.name },
  });

  return NextResponse.json({ unit }, { status: 201 });
}
