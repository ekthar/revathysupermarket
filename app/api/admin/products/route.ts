import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid product details." }, { status: 400 });

  const category = await prisma.category.upsert({
    where: { slug: slugify(parsed.data.category) },
    update: { name: parsed.data.category },
    create: { name: parsed.data.category, slug: slugify(parsed.data.category) }
  });

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      description: parsed.data.description,
      image: parsed.data.image,
      price: parsed.data.price,
      discountPrice: parsed.data.discountPrice,
      stock: parsed.data.stock,
      categoryId: category.id,
      unit: "1 pc"
    }
  });

  return NextResponse.json({ product });
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const products = await prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ products });
}
