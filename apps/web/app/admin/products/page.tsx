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
        category: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    }).catch(() => []),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true }
    }).catch(() => [])
  ]);

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
    isFeatured: product.isFeatured
  }));

  const categories = dbCategories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <AdminProductsPageClient
      products={products}
      categories={categories}
    />
  );
}
