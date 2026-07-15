"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Plus,
  Upload,
  Download,
  ToggleLeft,
  ToggleRight,
  Edit,
} from "lucide-react";
import {
  AdminPageShell,
  AdminDataTable,
  AdminPagination,
  AdminFilters,
  AdminConfirmDialog,
} from "@/components/admin/shared";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import type { Column } from "@/components/admin/shared/AdminDataTable";
import type { FilterConfig } from "@/components/admin/shared/AdminFilters";

// --- Types ---

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  unit: string;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; name: string };
}

interface ProductsPageClientProps {
  data: {
    products: ProductRow[];
    total: number;
    page: number;
    pageSize: number;
  };
  categories: { id: string; name: string }[];
  filters: {
    search: string;
    categoryId: string;
    isActive: string;
  };
}

// --- Helpers ---

function formatCurrency(price: number): string {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

function stockColorClass(stock: number): string {
  if (stock === 0) return "text-red-600 dark:text-red-400";
  if (stock <= 10) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

// --- Component ---

export function ProductsPageClient({
  data,
  categories,
  filters,
}: ProductsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<"activate" | "deactivate" | null>(null);
  const [isPending, startTransition] = useTransition();

  // Build category options for filter
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  const filterConfig = useMemo<FilterConfig[]>(
    () => [
      {
        key: "search",
        type: "search",
        label: "Products",
        placeholder: "Search product name or brand...",
      },
      {
        key: "categoryId",
        type: "select",
        label: "Category",
        placeholder: "All categories",
        options: categoryOptions,
      },
      {
        key: "isActive",
        type: "select",
        label: "Status",
        placeholder: "All statuses",
        options: [
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ],
      },
    ],
    [categoryOptions]
  );

  // URL updater — replaces params without full page reload
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.replace(`/admin/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleFilterChange = useCallback(
    (values: Record<string, string>) => {
      updateParams({ ...values, page: "" }); // reset to page 1
    },
    [updateParams]
  );

  const handlePageChange = useCallback(
    (page: number) => updateParams({ page: String(page) }),
    [updateParams]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => updateParams({ pageSize: String(size), page: "" }),
    [updateParams]
  );

  // Toggle single product active state
  const handleToggleActive = useCallback(
    async (productId: string) => {
      try {
        await fetch(`/api/admin/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: undefined }), // toggle handled server-side
        });
        startTransition(() => router.refresh());
      } catch (err) {
        console.error("Failed to toggle product:", err);
      }
    },
    [router]
  );

  // Bulk status update
  const handleBulkAction = useCallback(async () => {
    if (!confirmAction) return;
    const ids = Array.from(selectedKeys);
    const isActive = confirmAction === "activate";

    try {
      await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: ids.map((id) => ({ id, isActive })),
        }),
      });
      setConfirmAction(null);
      setSelectedKeys(new Set());
      startTransition(() => router.refresh());
    } catch (err) {
      console.error("Bulk update failed:", err);
    }
  }, [confirmAction, selectedKeys, router]);

  // --- Columns ---
  const columns = useMemo<Column<ProductRow>[]>(
    () => [
      {
        key: "image",
        label: "",
        width: "w-14",
        render: (item) => (
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
            {item.image ? (
              <Image
                src={item.image}
                width={40}
                height={40}
                alt={item.name}
                className="rounded-lg object-cover"
                unoptimized
              />
            ) : (
              <Package className="h-5 w-5 text-neutral-400" />
            )}
          </div>
        ),
      },
      {
        key: "name",
        label: "Name",
        sortable: true,
        width: "min-w-[200px]",
        render: (item) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {item.name}
            </p>
            {item.unit && (
              <p className="text-xs text-neutral-500">{item.unit}</p>
            )}
          </div>
        ),
      },
      {
        key: "category",
        label: "Category",
        hideOnMobile: true,
        render: (item) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {item.category.name}
          </span>
        ),
      },
      {
        key: "price",
        label: "Price",
        sortable: true,
        align: "right",
        render: (item) => (
          <div className="text-right">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {formatCurrency(item.price)}
            </span>
            {item.discountPrice && (
              <span className="ml-2 text-xs text-neutral-400 line-through">
                {formatCurrency(item.discountPrice)}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "stock",
        label: "Stock",
        sortable: true,
        align: "right",
        hideOnMobile: true,
        render: (item) => (
          <span className={`font-semibold ${stockColorClass(item.stock)}`}>
            {item.stock}
          </span>
        ),
      },
      {
        key: "isActive",
        label: "Status",
        render: (item) => (
          <AdminStatusBadge
            label={item.isActive ? "Active" : "Inactive"}
            variant={item.isActive ? "success" : "neutral"}
            size="sm"
          />
        ),
      },
      {
        key: "actions",
        label: "",
        width: "w-24",
        render: (item) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleToggleActive(item.id)}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              aria-label={item.isActive ? "Deactivate product" : "Activate product"}
              title={item.isActive ? "Deactivate" : "Activate"}
            >
              {item.isActive ? (
                <ToggleRight className="h-4 w-4 text-emerald-500" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
            </button>
            <Link
              href={`/admin/products/${item.id}`}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              aria-label={`Edit ${item.name}`}
            >
              <Edit className="h-4 w-4" />
            </Link>
          </div>
        ),
      },
    ],
    [handleToggleActive]
  );

  // --- Render ---
  return (
    <AdminPageShell
      eyebrow="Catalogue"
      title="Products"
      variant="green"
      breadcrumbs={[{ label: "Products" }]}
      actions={
        <>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
          <Link
            href="/admin/products?import=true"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <Upload className="h-4 w-4" />
            Import
          </Link>
          <Link
            href="/api/admin/products/export"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
            Export
          </Link>
        </>
      }
    >
      {/* Filters */}
      <div className="mb-4">
        <AdminFilters
          filters={filterConfig}
          values={{
            search: filters.search,
            categoryId: filters.categoryId,
            isActive: filters.isActive,
          }}
          onChange={handleFilterChange}
        />
      </div>

      {/* Table */}
      <AdminDataTable<ProductRow>
        columns={columns}
        data={data.products}
        getRowKey={(item) => item.id}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        onRowClick={(item) => router.push(`/admin/products/${item.id}`)}
        emptyState={{
          title: "No products found",
          description: "Try adjusting your filters or add a new product.",
          action: { label: "Add Product", href: "/admin/products/new" },
        }}
        bulkActions={
          <>
            <button
              onClick={() => setConfirmAction("activate")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <ToggleRight className="h-3.5 w-3.5" />
              Activate
            </button>
            <button
              onClick={() => setConfirmAction("deactivate")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              <ToggleLeft className="h-3.5 w-3.5" />
              Deactivate
            </button>
          </>
        }
      />

      {/* Pagination */}
      <div className="mt-4">
        <AdminPagination
          total={data.total}
          page={data.page}
          pageSize={data.pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Confirm Dialog */}
      <AdminConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleBulkAction}
        title={
          confirmAction === "activate"
            ? "Activate Products?"
            : "Deactivate Products?"
        }
        description={`This will ${confirmAction === "activate" ? "activate" : "deactivate"} ${selectedKeys.size} product${selectedKeys.size !== 1 ? "s" : ""}. Customers ${confirmAction === "deactivate" ? "will not see these products" : "will be able to order these products"}.`}
        confirmLabel={confirmAction === "activate" ? "Activate" : "Deactivate"}
        variant={confirmAction === "deactivate" ? "danger" : "default"}
      />
    </AdminPageShell>
  );
}
