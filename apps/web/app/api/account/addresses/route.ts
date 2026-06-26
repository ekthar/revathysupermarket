import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const addressSchema = z.object({
  label: z.string().min(2).default("Home"),
  houseName: z.string().min(2),
  street: z.string().min(2),
  landmark: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  isDefault: z.boolean().optional()
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid address." }, { status: 400 });

  // Prevent duplicate addresses - check if same houseName + pincode + street already exists
  const existing = await prisma.address.findFirst({
    where: {
      userId: session.user.id,
      houseName: parsed.data.houseName,
      pincode: parsed.data.pincode,
      street: parsed.data.street
    }
  });

  if (existing) {
    // Update existing address instead of creating duplicate
    if (parsed.data.isDefault) {
      await prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
    }
    const updated = await prisma.address.update({
      where: { id: existing.id },
      data: {
        label: parsed.data.label,
        landmark: parsed.data.landmark,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        isDefault: parsed.data.isDefault ?? existing.isDefault
      }
    });
    return NextResponse.json({ address: updated });
  }

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
  }
  const address = await prisma.address.create({
    data: { ...parsed.data, userId: session.user.id }
  });
  return NextResponse.json({ address });
}
