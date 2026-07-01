import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/account/settings
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id }
  });

  // Create default settings if none exist
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId: session.user.id }
    });
  }

  return NextResponse.json({ settings });
}

const settingsSchema = z.object({
  pushNotifications: z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  promotionalMessages: z.boolean().optional(),
  whatsappNotifications: z.boolean().optional(),
  priceDropAlerts: z.boolean().optional(),
  weeklyDeals: z.boolean().optional(),
  deliveryAlerts: z.boolean().optional()
});

// PATCH /api/account/settings
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings." }, { status: 400 });

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: { userId: session.user.id, ...parsed.data }
  });

  return NextResponse.json({ settings });
}
