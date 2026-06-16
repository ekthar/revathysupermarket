import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { getStoreSettingsForApi, saveStoreSettings } from "@/lib/store-settings";

const settingsSchema = z.object({
  storeName: z.string().min(2),
  address: z.string().min(3),
  phone: z.string().min(6),
  whatsapp: z.string().min(6),
  deliveryRadiusKm: z.coerce.number().min(1).max(50),
  serviceablePincodes: z
    .array(z.string().regex(/^\d{6}$/))
    .min(1),
  googleMapsUrl: z.string().trim().optional().default(""),
  instagramUrl: z.string().trim().optional().default(""),
  facebookUrl: z.string().trim().optional().default(""),
  gstin: z.string().trim().optional().default(""),
  gstRatePercent: z.coerce.number().min(0).max(28).default(0),
  gstBusinessName: z.string().trim().optional().default("")
});

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getStoreSettingsForApi() });
}

export async function PUT(request: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue?.message ?? "Invalid settings." }, { status: 400 });
    }

    await saveStoreSettings(parsed.data);
    revalidatePath("/");
    revalidatePath("/checkout");
    revalidatePath("/admin/settings");
    return NextResponse.json({ settings: parsed.data });
  } catch (error) {
    console.error("Settings save failed", error);
    return NextResponse.json({ error: "Settings could not be saved." }, { status: 500 });
  }
}
