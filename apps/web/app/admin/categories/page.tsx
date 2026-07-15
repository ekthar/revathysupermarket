import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied, AdminPageShell, AdminEmptyState } from "@/components/admin/shared";
import { Package, Edit, Trash2, Plus, FolderTree } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
      subCategories: {
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
    },
  });

  return (
    <AdminPageShell
      eyebrow="Catalogue"
      title="Categories"
      variant="green"
      breadcrumbs={[{ label: "Categories" }]}
      actions={
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Link>
      }
    >
      {categories.length === 0 ? (
        <AdminEmptyState
          title="No categories yet"
          description="Create your first category to start organizing products."
          action={{ label: "Add Category", href: "/admin/categories/new" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              {/* Header row */}
              <div className="flex items-start gap-3">
                {/* Image or icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  {category.image ? (
                    <Image
                      src={category.image}
                      width={48}
                      height={48}
                      alt={category.name}
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : category.icon ? (
                    <span className="text-xl">{category.icon}</span>
                  ) : (
                    <FolderTree className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>

                {/* Name and count */}
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                    {category.name}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                    <Package className="h-3 w-3" />
                    {category._count.products} product{category._count.products !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                    aria-label={`Edit ${category.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Description */}
              {category.description && (
                <p className="mt-3 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                  {category.description}
                </p>
              )}

              {/* Subcategories */}
              {category.subCategories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {category.subCategories.map((sub) => (
                    <span
                      key={sub.id}
                      className="inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      {sub.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Sort order indicator */}
              <div className="mt-3 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                  Order: {category.sortOrder}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
