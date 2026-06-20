import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { canManageSettings } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getStoreSettingsForApi, saveStoreSettings } from "@/lib/store-settings";

const settingsSchema = z.object({
  storeName: z.string().min(2),
  address: z.string().min(3),
  phone: z.string().min(6),
  whatsapp: z.string().min(6),
  deliveryRadiusKm: z.coerce.number().min(1).max(50),
  storeLatitude: z.coerce.number().min(-90).max(90),
  storeLongitude: z.coerce.number().min(-180).max(180),
  serviceablePincodes: z
    .array(z.string().regex(/^\d{6}$/))
    .min(1),
  googleMapsUrl: z.string().trim().optional().default(""),
  instagramUrl: z.string().trim().optional().default(""),
  facebookUrl: z.string().trim().optional().default(""),
  gstin: z.string().trim().optional().default(""),
  gstRatePercent: z.coerce.number().min(0).max(28).default(0),
  gstBusinessName: z.string().trim().optional().default(""),
  storeOpenTime: z.string().regex(/^\d{2}:\d{2}$/).optional().default("08:00"),
  storeCloseTime: z.string().regex(/^\d{2}:\d{2}$/).optional().default("21:00"),
  isStoreOpen: z.coerce.boolean().optional().default(true),
  minimumOrderValue: z.coerce.number().min(0).max(10000).optional().default(99),
  deliveryEstimateMin: z.coerce.number().min(5).max(120).optional().default(25),
  deliveryEstimateMax: z.coerce.number().min(10).max(180).optional().default(45),
  deliveryFee: z.coerce.number().min(0).max(500).optional().default(40),
  freeDeliveryThreshold: z.coerce.number().min(0).max(50000).optional().default(500)
});

export async function GET() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getStoreSettingsForApi() });
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue?.message ?? "Invalid settings." }, { status: 400 });
    }

    await saveStoreSettings(parsed.data);
    revalidatePath("/");
    revalidatePath("/checkout");
    revalidatePath("/admin/settings");
    revalidateTag("homepage");
    revalidateTag("store-settings");
    await writeAuditLog({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      action: "settings_updated",
      targetType: "Setting",
      targetId: "store",
      metadata: {
        deliveryRadiusKm: parsed.data.deliveryRadiusKm,
        serviceablePincodes: parsed.data.serviceablePincodes,
        gstRatePercent: parsed.data.gstRatePercent
      }
    });
    return NextResponse.json({ settings: parsed.data });
  } catch (error) {
    console.error("Settings save failed", error);
    return NextResponse.json({ error: "Settings could not be saved." }, { status: 500 });
  }
}



// PATCH - partial settings update (e.g., logoUrl)
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();

    // Support updating individual settings like logoUrl
    const allowedKeys = ["logoUrl"];
    const updates: Array<{ key: string; value: string }> = [];

    for (const key of allowedKeys) {
      if (key in body && typeof body[key] === "string") {
        updates.push({ key, value: body[key] });
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    await Promise.all(
      updates.map(({ key, value }) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      )
    );

    revalidatePath("/");
    revalidateTag("store-settings");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings patch failed", error);
    return NextResponse.json({ error: "Settings could not be saved." }, { status: 500 });
  }
}
