import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageProducts } from "@/lib/authz";
import { CategoryManagementClient } from "@/components/admin/category-management-client";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!canManageProducts(session?.user?.role)) {
    return (
      <div className="rounded-[1.75rem] border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Categories</h2>
        <p className="mt-2 text-sm text-muted-foreground">Product management access is required.</p>
      </div>
    );
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } }
  }).catch(() => []);

  return (
    <div>
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Product organization</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">Categories</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create, edit, reorder, and manage product categories with images.</p>
      </section>
      <CategoryManagementClient
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          image: c.image,
          sortOrder: c.sortOrder,
          productCount: c._count.products
        }))}
      />
    </div>
  );
}
