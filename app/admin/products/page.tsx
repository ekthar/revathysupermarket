import { prisma } from "@/lib/prisma";
import { ProductManagementForm } from "@/components/admin/product-management-form";
import { AdminProductsClient, type AdminProduct } from "@/components/admin/admin-products-client";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
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
        isActive: product.isActive
      }));

  return (
    <div>
      <ProductManagementForm />
      <AdminProductsClient products={products} />
    </div>
  );
}
