import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { isAllowedProductImageUrl, PRODUCT_IMAGE_FALLBACK, safeProductImageUrl } from "@/lib/image";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = productSchema.safeParse(await request.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join(".");
      return NextResponse.json(
        { error: field ? `${field}: ${issue.message}` : "Invalid product details." },
        { status: 400 }
      );
    }

    const image = parsed.data.image?.trim() || PRODUCT_IMAGE_FALLBACK;
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
        stock: parsed.data.stock,
        categoryId: category.id,
        unit: parsed.data.unit?.trim() || "1 pc",
        isActive: parsed.data.isActive ?? true,
        isFeatured: parsed.data.isFeatured ?? false
      }
    });

    revalidateTag("products");
    revalidateTag("homepage");
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product create failed", error);
    return NextResponse.json(
      { error: "Product could not be saved. Please check the details and try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      image: true,
      price: true,
      discountPrice: true,
      stock: true,
      popularity: true,
      unit: true,
      isActive: true,
      isFeatured: true,
      createdAt: true,
      category: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ products });
}
