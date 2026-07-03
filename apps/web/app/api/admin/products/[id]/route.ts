import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { isAllowedProductImageUrl, normalizeImageUrl, safeProductImageUrl } from "@/lib/image";
import { ensureProductUnits } from "@/lib/admin-product-bulk";

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
    const session = await auth();
    const unauthorized = requireProductStaff(session);
    if (unauthorized) return unauthorized;
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
    if (parsed.data.image) {
      parsed.data.image = normalizeImageUrl(parsed.data.image);
      if (!isAllowedProductImageUrl(parsed.data.image)) {
        return NextResponse.json(
          { error: "Use a valid HTTPS image URL." },
          { status: 400 }
        );
      }
    }

    const { category, ...productData } = parsed.data;
    const before = await prisma.product.findUnique({
      where: { id },
      select: { name: true, price: true, discountPrice: true, stock: true, isActive: true, isFeatured: true }
    });
    const unit = productData.unit?.trim();
    if (unit) await ensureProductUnits([unit]);
    const slug = productData.name ? await uniqueProductSlug(productData.name, id) : undefined;
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        image: productData.image !== undefined ? safeProductImageUrl(productData.image) : undefined,
        unit,
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
    revalidateTag("homepage");
    await writeAuditLog({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      action: "product_updated",
      targetType: "Product",
      targetId: product.id,
      metadata: {
        before: before ? {
          ...before,
          price: Number(before.price),
          discountPrice: before.discountPrice ? Number(before.discountPrice) : null
        } : null,
        after: {
          name: product.name,
          price: Number(product.price),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
          stock: product.stock,
          isActive: product.isActive,
          isFeatured: product.isFeatured
        }
      }
    });
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
    const session = await auth();
    const unauthorized = requireProductStaff(session);
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, isActive: true }
    });
    revalidateTag("products");
    revalidateTag("homepage");
    await writeAuditLog({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      action: "product_deactivated",
      targetType: "Product",
      targetId: product.id,
      metadata: { name: product.name, reason: "Product delete deactivates to preserve related data." }
    });
    return NextResponse.json({ ok: true, action: "deactivated", product });
  } catch (error) {
    console.error("Product delete failed", error);
    return NextResponse.json({ error: "Product could not be deactivated." }, { status: 500 });
  }
}
