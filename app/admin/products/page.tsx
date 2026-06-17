import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageProducts } from "@/lib/authz";
import { ProductManagementForm } from "@/components/admin/product-management-form";
import { AdminProductsClient, type AdminProduct } from "@/components/admin/admin-products-client";
import { ProductSpreadsheetManager } from "@/components/admin/product-spreadsheet-manager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await auth();
  if (!canManageProducts(session?.user?.role)) {
    return (
      <div className="rounded-[1.75rem] border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Products</h2>
        <p className="mt-2 text-sm text-muted-foreground">Product access is required.</p>
      </div>
    );
  }

  const dbProducts = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      image: true,
      price: true,
      discountPrice: true,
      stock: true,
      unit: true,
      isActive: true,
      isFeatured: true,
      category: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  }).catch(() => []);
  const products: AdminProduct[] = dbProducts.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category.name,
        price: Number(product.price),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
        stock: product.stock,
        image: product.image,
        description: product.description,
        unit: product.unit,
        isActive: product.isActive,
        isFeatured: product.isFeatured
      }));

  return (
    <div>
      <ProductManagementForm />
      <ProductSpreadsheetManager products={products} />
      <AdminProductsClient products={products} />
    </div>
  );
}
