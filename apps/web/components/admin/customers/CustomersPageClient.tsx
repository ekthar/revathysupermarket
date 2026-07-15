"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, Download, Eye } from "lucide-react";
import {
  AdminPageShell,
  AdminDataTable,
  AdminPagination,
  AdminFilters,
} from "@/components/admin/shared";
import type { Column } from "@/components/admin/shared/AdminDataTable";
import type { FilterConfig } from "@/components/admin/shared/AdminFilters";

// --- Types ---

interface CustomerRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  orderCount: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastOrderDate: string | null;
  isActive: boolean;
}

interface CustomersPageClientProps {
  data: {
    customers: CustomerRow[];
    total: number;
    page: number;
    pageSize: number;
  };
  filters: {
    search: string;
  };
}

// --- Filter Config ---

const FILTER_CONFIG: FilterConfig[] = [
  {
    key: "search",
    type: "search",
    label: "Customers",
    placeholder: "Search name or phone...",
  },
];

// --- Helpers ---

function formatCurrency(value: number): string {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function exportCustomersCSV(customers: CustomerRow[]): void {
  const headers = ["Name", "Phone", "Email", "Orders", "Total Spent", "Loyalty Points"];
  const rows = customers.map((c) => [
    c.name || "-",
    c.phone || "-",
    c.email || "-",
    String(c.orderCount),
    String(c.totalSpent),
    String(c.loyaltyPoints),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Component ---

export function CustomersPageClient({ data, filters }: CustomersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL updater
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
      router.replace(`/admin/customers?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleFilterChange = useCallback(
    (values: Record<string, string>) => {
      updateParams({ ...values, page: "" });
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

  const handleRowClick = useCallback(
    (item: CustomerRow) => router.push(`/admin/customers/${item.id}`),
    [router]
  );

  // --- Columns ---
  const columns = useMemo<Column<CustomerRow>[]>(
    () => [
      {
        key: "name",
        label: "Name",
        width: "min-w-[160px]",
        render: (item) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {item.name || "—"}
            </p>
            {item.email && (
              <p className="text-xs text-neutral-500">{item.email}</p>
            )}
          </div>
        ),
      },
      {
        key: "phone",
        label: "Phone",
        width: "min-w-[120px]",
        render: (item) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            {item.phone || "—"}
          </span>
        ),
      },
      {
        key: "orderCount",
        label: "Orders",
        align: "center",
        width: "w-20",
        render: (item) => (
          <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-neutral-100 px-2 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {item.orderCount}
          </span>
        ),
      },
      {
        key: "totalSpent",
        label: "Total Spent",
        align: "right",
        width: "min-w-[110px]",
        render: (item) => (
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {formatCurrency(item.totalSpent)}
          </span>
        ),
      },
      {
        key: "loyaltyPoints",
        label: "Loyalty Points",
        align: "center",
        width: "w-28",
        hideOnMobile: true,
        render: (item) => (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {item.loyaltyPoints.toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        key: "lastOrder",
        label: "Last Order",
        hideOnMobile: true,
        width: "w-28",
        render: (item) => (
          <span className="text-xs text-neutral-500">
            {item.lastOrderDate ? relativeTime(item.lastOrderDate) : "Never"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "",
        align: "right",
        width: "w-12",
        render: () => (
          <Eye className="h-4 w-4 text-neutral-400" />
        ),
      },
    ],
    []
  );

  return (
    <AdminPageShell
      eyebrow="People"
      title="Customers"
      description={`${data.total.toLocaleString("en-IN")} registered customers`}
      breadcrumbs={[{ label: "Customers" }]}
      actions={
        <button
          onClick={() => exportCustomersCSV(data.customers)}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      }
    >
      {/* Filters */}
      <AdminFilters
        filters={FILTER_CONFIG}
        values={{ search: filters.search }}
        onChange={handleFilterChange}
      />

      {/* Table */}
      <AdminDataTable
        columns={columns}
        data={data.customers}
        getRowKey={(item) => item.id}
        onRowClick={handleRowClick}
        emptyState={{
          title: "No customers found",
          description: "Adjust your search or wait for new signups.",
        }}
      />

      {/* Pagination */}
      <AdminPagination
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </AdminPageShell>
  );
}
