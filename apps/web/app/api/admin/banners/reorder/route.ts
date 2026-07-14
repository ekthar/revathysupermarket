import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";

const schema = z.object({
  bannerIds: z.array(z.string().min(1)).min(1)
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const unauthorized = requireProductStaff(session);
    if (unauthorized) return unauthorized;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid banner order." }, { status: 400 });
    }

    const { bannerIds } = parsed.data;

    // Design tradeoff: We encode sort order by mutating createdAt timestamps
    // rather than adding a dedicated sortOrder column. This avoids a schema
    // migration and works with the existing ORDER BY createdAt DESC query.
    // The original creation timestamps are lost, which is acceptable because
    // banners are short-lived promotional content and the audit log captures
    // the reorder event. If audit-grade timestamps become necessary, add a
    // `sortOrder` integer column to the Banner model.
    const now = Date.now();
    await prisma.$transaction(
      bannerIds.map((id, index) =>
        prisma.banner.update({
          where: { id },
          data: { createdAt: new Date(now - index * 1000) }
        })
      )
    );

    revalidatePath("/");
    revalidatePath("/admin/settings");
    revalidateTag("homepage");
    revalidateTag("banners");

    await writeAuditLog({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      action: "banners_reordered",
      targetType: "Banner",
      targetId: bannerIds[0],
      metadata: { bannerIds }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Banner reorder failed", error);
    return NextResponse.json({ error: "Banners could not be reordered." }, { status: 500 });
  }
}
