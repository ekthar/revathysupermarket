import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { ProductService } from "@/lib/services";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied } from "@/components/admin/shared";
import { ProductsPageClient } from "@/components/admin/products";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    categoryId?: string;
    isActive?: string;
    sortBy?: string;
    sortDir?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "catalogue.view")) {
    return <AdminAccessDenied permission="catalogue.view" />;
  }

  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(params.pageSize || "20", 10) || 20));

  // Parse isActive filter
  let isActive: boolean | undefined;
  if (params.isActive === "true") isActive = true;
  else if (params.isActive === "false") isActive = false;

  const [result, categories] = await Promise.all([
    ProductService.list({
      page,
      pageSize,
      search: params.search || undefined,
      categoryId: params.categoryId || undefined,
      isActive,
      sortBy: (params.sortBy as "name" | "price" | "stock" | "createdAt") || undefined,
      sortDir: (params.sortDir as "asc" | "desc") || undefined,
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize Decimal values for the client
  const serialized = {
    products: result.products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image,
      price: Number(p.price),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      stock: p.stock,
      unit: p.unit,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      category: p.category,
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };

  return (
    <ProductsPageClient
      data={serialized}
      categories={categories}
      filters={{
        search: params.search || "",
        categoryId: params.categoryId || "",
        isActive: params.isActive || "",
      }}
    />
  );
}
