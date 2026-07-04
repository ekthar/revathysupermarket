import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { isAllowedProductImageUrl, normalizeImageUrl, PRODUCT_IMAGE_FALLBACK, safeProductImageUrl } from "@/lib/image";
import { ensureProductUnits } from "@/lib/admin-product-bulk";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const unauthorized = requireProductStaff(session);
    if (unauthorized) return unauthorized;
    const parsed = productSchema.safeParse(await request.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join(".");
      return NextResponse.json(
        { error: field ? `${field}: ${issue.message}` : "Invalid product details." },
        { status: 400 }
      );
    }

    // Check for duplicate product name (case-insensitive)
    const existingProduct = await prisma.product.findFirst({
      where: { name: { equals: parsed.data.name.trim(), mode: "insensitive" } },
    });
    if (existingProduct) {
      return NextResponse.json(
        { error: `A product named "${existingProduct.name}" already exists.` },
        { status: 409 }
      );
    }

    const image = normalizeImageUrl(parsed.data.image?.trim() || "") || PRODUCT_IMAGE_FALLBACK;
    if (!isAllowedProductImageUrl(image)) {
      return NextResponse.json(
        { error: "Use a valid HTTPS image URL. Localhost, admin page, and API URLs are not image links." },
        { status: 400 }
      );
    }

    const category = await prisma.category.upsert({
      where: { slug: slugify(parsed.data.category) },
      update: { name: parsed.data.category },
      create: { name: parsed.data.category, slug: slugify(parsed.data.category) }
    });
    const unit = parsed.data.unit?.trim() || "1 pc";
    await ensureProductUnits([unit]);

    const baseSlug = slugify(parsed.data.name);
    let slug = baseSlug;
    let suffix = 2;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const product = await prisma.product.create({
      data: {
        name: parsed.data.name.trim(),
        slug,
        description: parsed.data.description.trim(),
        image: safeProductImageUrl(image),
        price: parsed.data.price,
        discountPrice: parsed.data.discountPrice,
        gstRate: parsed.data.gstRate ?? null,
        stock: parsed.data.stock,
        categoryId: category.id,
        unit,
        isActive: parsed.data.isActive ?? true,
        isFeatured: parsed.data.isFeatured ?? false,
        costPrice: parsed.data.costPrice ?? null,
        brand: parsed.data.brand?.trim() || null
      }
    });

    revalidateTag("products");
    revalidateTag("homepage");
    await writeAuditLog({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      action: "product_created",
      targetType: "Product",
      targetId: product.id,
      metadata: { name: product.name, price: Number(product.price), stock: product.stock }
    });
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product create failed", error);
    return NextResponse.json(
      { error: "Product could not be saved. Please check the details and try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        image: true,
        price: true,
        discountPrice: true,
        costPrice: true,
        brand: true,
        stock: true,
        popularity: true,
        unit: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
        category: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count(),
  ]);

  return NextResponse.json({
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
