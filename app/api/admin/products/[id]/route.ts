import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { isAllowedProductImageUrl } from "@/lib/image";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = productSchema.partial().safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid product details." }, { status: 400 });
  if (parsed.data.image && !isAllowedProductImageUrl(parsed.data.image)) {
    return NextResponse.json(
      { error: "Use a valid HTTPS image URL from Unsplash or Cloudflare R2. Do not paste an admin page URL." },
      { status: 400 }
    );
  }

  const { category, ...productData } = parsed.data;
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...productData,
      slug: productData.name ? slugify(productData.name) : undefined,
      category: category
        ? {
            connectOrCreate: {
              where: { slug: slugify(category) },
              create: { name: category, slug: slugify(category) }
            }
          }
        : undefined
    }
  });
  return NextResponse.json({ product });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
