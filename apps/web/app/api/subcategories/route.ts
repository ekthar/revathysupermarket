import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");

  if (!categoryId) {
    return NextResponse.json({ subcategories: [] });
  }

  const subcategories = await prisma.subCategory.findMany({
    where: { categoryId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      sortOrder: true,
    },
  }).catch(() => []);

  return NextResponse.json({ subcategories });
}
