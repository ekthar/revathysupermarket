import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { normalizeImageUrl } from "@/lib/image";

const schema = z.object({
  title: z.string().min(2).optional(),
  subtitle: z.string().optional(),
  image: z.string().url().optional(),
  href: z.string().optional(),
  isActive: z.boolean().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const unauthorized = requireProductStaff(session);
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid banner." }, { status: 400 });
    const updateData = { ...parsed.data };
    if (updateData.image) updateData.image = normalizeImageUrl(updateData.image);
    const banner = await prisma.banner.update({ where: { id }, data: updateData });
    revalidatePath("/");
    revalidatePath("/admin/settings");
    revalidateTag("homepage");
    revalidateTag("banners");
    await writeAuditLog({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      action: "banner_updated",
      targetType: "Banner",
      targetId: banner.id,
      metadata: parsed.data
    });
    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Banner update failed", error);
    return NextResponse.json({ error: "Banner could not be updated." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const unauthorized = requireProductStaff(session);
    if (unauthorized) return unauthorized;
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/admin/settings");
    revalidateTag("homepage");
    revalidateTag("banners");
    await writeAuditLog({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      action: "banner_deleted",
      targetType: "Banner",
      targetId: id
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Banner delete failed", error);
    return NextResponse.json({ error: "Banner could not be deleted." }, { status: 500 });
  }
}
