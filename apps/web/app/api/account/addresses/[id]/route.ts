import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  if (body.isDefault) {
    await prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
  }
  const data: Record<string, unknown> = {};
  for (const key of ["label", "houseName", "street", "landmark", "pincode", "latitude", "longitude", "isDefault"]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  await prisma.address.updateMany({
    where: { id, userId: session.user.id },
    data: Object.keys(data).length > 0 ? data : { isDefault: Boolean(body.isDefault) }
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Check if this is the primary (default) address — cannot delete
  const address = await prisma.address.findFirst({ where: { id, userId: session.user.id } });
  if (!address) return NextResponse.json({ error: "Address not found." }, { status: 404 });
  if (address.isDefault) {
    return NextResponse.json(
      { error: "Primary address cannot be deleted. Set another address as primary first." },
      { status: 400 }
    );
  }

  await prisma.address.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
