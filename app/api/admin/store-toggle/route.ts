import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings } from "@/lib/authz";
import { revalidateTag } from "next/cache";

// POST /api/admin/store-toggle - Quick open/close store
export async function POST(request: Request) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isOpen } = await request.json();

  await prisma.setting.upsert({
    where: { key: "isStoreOpen" },
    update: { value: String(isOpen) },
    create: { key: "isStoreOpen", value: String(isOpen) }
  });

  revalidateTag("store-settings");

  return NextResponse.json({ isStoreOpen: isOpen });
}
