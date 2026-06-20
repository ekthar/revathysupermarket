import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { normalizeImageUrl } from "@/lib/image";

const schema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  image: z.string().url(),
  href: z.string().optional(),
  isActive: z.boolean().default(true)
});

export async function GET() {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;
  return NextResponse.json({ banners: await prisma.banner.findMany({ orderBy: { createdAt: "desc" } }) });
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const unauthorized = requireProductStaff(session);
    if (unauthorized) return unauthorized;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid banner." }, { status: 400 });
    const bannerData = { ...parsed.data, image: normalizeImageUrl(parsed.data.image) };
    const banner = await prisma.banner.create({ data: bannerData });
    revalidatePath("/");
    revalidatePath("/admin/settings");
    revalidateTag("homepage");
    revalidateTag("banners");
    await writeAuditLog({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      action: "banner_created",
      targetType: "Banner",
      targetId: banner.id,
      metadata: { title: banner.title }
    });
    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Banner create failed", error);
    return NextResponse.json({ error: "Banner could not be saved." }, { status: 500 });
  }
}
