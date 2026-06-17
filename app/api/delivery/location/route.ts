import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isDeliveryRole } from "@/lib/authz";
import { deliveryLocationSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isDeliveryRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = deliveryLocationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid location." }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      currentLatitude: parsed.data.latitude,
      currentLongitude: parsed.data.longitude,
      locationUpdatedAt: new Date()
    }
  });
  return NextResponse.json({ ok: true });
}
