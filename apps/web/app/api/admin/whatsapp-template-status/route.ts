import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canManageSettings } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  template: z.string().min(2),
  status: z.enum(["approved", "pending", "rejected"])
});

export async function GET() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.setting.findMany({
    where: { key: { startsWith: "whatsappTemplateStatus." } }
  });
  return NextResponse.json({
    statuses: Object.fromEntries(rows.map((row) => [row.key.replace("whatsappTemplateStatus.", ""), row.value]))
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid template status." }, { status: 400 });

  await prisma.setting.upsert({
    where: { key: `whatsappTemplateStatus.${parsed.data.template}` },
    create: { key: `whatsappTemplateStatus.${parsed.data.template}`, value: parsed.data.status },
    update: { value: parsed.data.status }
  });
  return NextResponse.json({ ok: true });
}
