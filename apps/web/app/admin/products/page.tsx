import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied } from "@/components/admin/shared";
import { AdminProductsPageClient } from "@/components/admin/admin-products-page-client";
import { safeProductImageUrl } from "@/lib/image";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "catalogue.view")) {
    return <AdminAccessDenied permission="catalogue.view" />;
  }

  const [rawProducts, categories, units] = await Promise.all([
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
        gstRate: true,
        brand: true,
        stock: true,
        unit: true,
        isActive: true,
        isFeatured: true,
        category: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.unit.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Count products per unit manually (no prisma relation)
  const productCounts = await prisma.product.groupBy({
    by: ["unit"],
    _count: { _all: true },
  });
  const countMap = new Map(productCounts.map((c) => [c.unit, c._count._all]));

  // Serialize for client (Decimal → number, safe image URLs)
  const products = rawProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    image: safeProductImageUrl(p.image),
    price: Number(p.price),
    discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
    costPrice: p.costPrice ? Number(p.costPrice) : undefined,
    gstRate: p.gstRate ? Number(p.gstRate) : undefined,
    brand: p.brand || undefined,
    stock: p.stock,
    unit: p.unit || undefined,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    category: p.category.name,
  }));

  const serializedUnits = units.map((u) => ({
    id: u.id,
    name: u.name,
    productCount: countMap.get(u.name) ?? 0,
  }));

  return (
    <AdminProductsPageClient
      products={products}
      categories={categories}
      units={serializedUnits}
    />
  );
}
