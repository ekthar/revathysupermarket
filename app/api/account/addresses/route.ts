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

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
  }
  const address = await prisma.address.create({
    data: { ...parsed.data, userId: session.user.id }
  });
  return NextResponse.json({ address });
}
