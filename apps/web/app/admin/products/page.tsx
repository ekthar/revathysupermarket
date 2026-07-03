import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageProducts } from "@/lib/authz";
import { type AdminProduct } from "@/components/admin/admin-products-client";
import { AdminProductsPageClient } from "@/components/admin/admin-products-page-client";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await auth();
  if (!canManageProducts(session?.user?.role)) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Products</h2>
        <p className="mt-2 text-sm text-muted-foreground">Product access is required.</p>
      </div>
    );
  }

  const [dbProducts, dbCategories] = await Promise.all([
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
        _count: { select: { orderItems: true } }
      },
      orderBy: { createdAt: "desc" }
    }).catch(() => []),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true }
    }).catch(() => [])
  ]);

  let dbUnits = await prisma.unit.findMany({ orderBy: { name: "asc" } }).catch(() => []);
  if (dbUnits.length === 0) {
    const defaultUnits = ["1 pc", "10 nos", "1 kg", "500 g", "250 g", "100 g", "1 L", "500 ml", "250 ml", "1 packet", "1 box", "1 bundle"];
    await prisma.unit.createMany({
      data: defaultUnits.map((name) => ({ name })),
      skipDuplicates: true
    }).catch(() => null);
    dbUnits = await prisma.unit.findMany({ orderBy: { name: "asc" } }).catch(() => []);
  }

  const products: AdminProduct[] = dbProducts.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category.name,
    price: Number(product.price),
    discountPrice: product.discountPrice != null ? Number(product.discountPrice) : undefined,
    costPrice: product.costPrice != null ? Number(product.costPrice) : undefined,
    gstRate: product.gstRate != null ? Number(product.gstRate) : undefined,
    brand: product.brand ?? undefined,
    stock: product.stock,
    image: product.image,
    description: product.description,
    unit: product.unit,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isSold: (product as any)._count?.orderItems > 0
  }));

  const categories = dbCategories.map((c) => ({ id: c.id, name: c.name }));

  const productCounts = await prisma.product.groupBy({
    by: ["unit"],
    _count: { _all: true },
    where: { unit: { in: dbUnits.map((u) => u.name) } }
  });
  const productCountByUnit = new Map(
    productCounts.map((count) => [count.unit, count._count._all])
  );
  const units = dbUnits.map((u) => ({
    id: u.id,
    name: u.name,
    productCount: productCountByUnit.get(u.name) ?? 0
  }));

  return (
    <AdminProductsPageClient
      products={products}
      categories={categories}
      units={units}
    />
  );
}
