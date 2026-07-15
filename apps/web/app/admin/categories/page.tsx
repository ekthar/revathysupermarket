import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied } from "@/components/admin/shared";
import { CategoryManagementClient } from "@/components/admin/category-management-client";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "catalogue.view")) {
    return <AdminAccessDenied permission="catalogue.view" />;
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
    },
  });

  // Check which categories have products with orders (can't be deleted)
  const categoriesWithOrders = await prisma.category.findMany({
    where: {
      products: { some: { orderItems: { some: {} } } },
    },
    select: { id: true },
  });
  const salesSet = new Set(categoriesWithOrders.map((c) => c.id));

  const serialized = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    image: cat.image,
    icon: cat.icon,
    sortOrder: cat.sortOrder,
    productCount: cat._count.products,
    hasSales: salesSet.has(cat.id),
  }));

  return <CategoryManagementClient categories={serialized} />;
}
