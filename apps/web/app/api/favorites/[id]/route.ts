import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/favorites/[id] - Remove a product from favorites (id = productId)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: productId } = await params;

  await prisma.favorite.deleteMany({
    where: {
      userId: session.user.id,
      productId
    }
  });

  return NextResponse.json({ ok: true });
}
