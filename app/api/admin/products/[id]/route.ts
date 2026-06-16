import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { isAllowedProductImageUrl, safeProductImageUrl } from "@/lib/image";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

async function uniqueProductSlug(name: string, id: string) {
  const baseSlug = slugify(name) || "product";
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === id) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const parsed = productSchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join(".");
      return NextResponse.json(
        { error: field ? `${field}: ${issue.message}` : "Invalid product details." },
        { status: 400 }
      );
    }
    if (parsed.data.image && !isAllowedProductImageUrl(parsed.data.image)) {
      return NextResponse.json(
        { error: "Use a valid HTTPS image URL. Localhost, admin page, and API URLs are not image links." },
        { status: 400 }
      );
    }

    const { category, ...productData } = parsed.data;
    const slug = productData.name ? await uniqueProductSlug(productData.name, id) : undefined;
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        image: productData.image !== undefined ? safeProductImageUrl(productData.image) : undefined,
        unit: productData.unit?.trim(),
        slug,
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
    revalidateTag("products");
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product update failed", error);
    return NextResponse.json(
      { error: "Product could not be updated. Please check the details and try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true }
    });
    revalidateTag("products");
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    console.error("Product delete failed", error);
    return NextResponse.json({ error: "Product could not be deactivated." }, { status: 500 });
  }
}
