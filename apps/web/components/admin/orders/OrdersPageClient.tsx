"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, RefreshCw, CheckCircle, Eye } from "lucide-react";
import {
  AdminPageShell,
  AdminDataTable,
  AdminPagination,
  AdminFilters,
  AdminConfirmDialog,
} from "@/components/admin/shared";
import {
  AdminStatusBadge,
  orderStatusVariant,
  orderStatusLabel,
} from "@/components/admin/shared/AdminStatusBadge";
import type { Column } from "@/components/admin/shared/AdminDataTable";
import type { FilterConfig } from "@/components/admin/shared/AdminFilters";
import { formatCurrency } from "@/lib/utils";

// --- Types ---

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  itemCount: number;
  createdAt: string;
  acknowledgedAt: string | null;
  deliveryPartner: { id: string; name: string | null } | null;
}

interface OrdersPageClientProps {
  data: {
    orders: OrderRow[];
    total: number;
    page: number;
    pageSize: number;
  };
  filters: {
    status: string;
    search: string;
    dateFrom: string;
  };
}

// --- Constants ---

const STATUS_OPTIONS = [
  { value: "ORDER_RECEIVED", label: "Received" },
  { value: "AWAITING_CUSTOMER_APPROVAL", label: "Awaiting Approval" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "PACKING", label: "Packing" },
  { value: "READY_FOR_DELIVERY", label: "Ready" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "ARRIVING", label: "Arriving" },
  { value: "CUSTOMER_UNAVAILABLE", label: "Unavailable" },
  { value: "RETURNED_TO_STORE", label: "Returned" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const FILTER_CONFIG: FilterConfig[] = [
  { key: "search", type: "search", label: "Orders", placeholder: "Search order # or customer..." },
  { key: "status", type: "select", label: "Status", placeholder: "All statuses", options: STATUS_OPTIONS },
  { key: "dateFrom", type: "date", label: "From date" },
];

// --- Helpers ---

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
  return new Date(isoDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// --- Component ---

export function OrdersPageClient({ data, filters }: OrdersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<"ready" | "acknowledge" | null>(null);

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
      router.replace(`/admin/orders?${params.toString()}`);
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

  const handleRowClick = useCallback(
    (item: OrderRow) => router.push(`/admin/orders/${item.id}`),
    [router]
  );

  const handleRefresh = useCallback(() => router.refresh(), [router]);

  const handleBulkAction = useCallback(async () => {
    // Filter out orders that are already acknowledged, delivered, or cancelled
    const validOrders = data.orders.filter((order) => {
      if (!selectedKeys.has(order.id)) return false;
      if (confirmAction === "acknowledge") {
        // Cannot acknowledge if already acknowledged, delivered, or cancelled
        return !order.acknowledgedAt && order.status !== "DELIVERED" && order.status !== "CANCELLED";
      }
      if (confirmAction === "ready") {
        // Cannot mark ready if already delivered or cancelled
        return order.status !== "DELIVERED" && order.status !== "CANCELLED" && order.status !== "READY_FOR_DELIVERY" && order.status !== "OUT_FOR_DELIVERY";
      }
      return true;
    });

    if (validOrders.length === 0) {
      setConfirmAction(null);
      setSelectedKeys(new Set());
      return;
    }

    // In a real app this calls an API with validOrders IDs only
    setConfirmAction(null);
    setSelectedKeys(new Set());
    router.refresh();
  }, [router, data.orders, selectedKeys, confirmAction]);

  // --- Columns ---
  const columns = useMemo<Column<OrderRow>[]>(
    () => [
      {
        key: "orderNumber",
        label: "Order #",
        sortable: true,
        width: "min-w-[100px]",
        render: (item) => (
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            #{item.orderNumber}
          </span>
        ),
      },
      {
        key: "customerName",
        label: "Customer",
        width: "min-w-[150px]",
        render: (item) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {item.customerName}
            </p>
            <p className="text-xs text-neutral-500">{item.phone}</p>
          </div>
        ),
      },
      {
        key: "itemCount",
        label: "Items",
        hideOnMobile: true,
        render: (item) => (
          <span className="text-neutral-600 dark:text-neutral-400">
            {item.itemCount} item{item.itemCount !== 1 ? "s" : ""}
          </span>
        ),
      },
      {
        key: "total",
        label: "Total",
        align: "right",
        sortable: true,
        render: (item) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {formatCurrency(item.total)}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (item) => (
          <AdminStatusBadge
            label={orderStatusLabel(item.status)}
            variant={orderStatusVariant(item.status)}
            size="sm"
          />
        ),
      },
      {
        key: "createdAt",
        label: "Time",
        sortable: true,
        hideOnMobile: true,
        render: (item) => (
          <span className="text-sm text-neutral-500" title={new Date(item.createdAt).toLocaleString("en-IN")}>
            {relativeTime(item.createdAt)}
          </span>
        ),
      },
      {
        key: "actions",
        label: "",
        width: "w-10",
        render: (item) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/orders/${item.id}`);
            }}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
            aria-label={`View order ${item.orderNumber}`}
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [router]
  );

  // --- Render ---
  return (
    <AdminPageShell
      eyebrow="Operations"
      title="Orders"
      breadcrumbs={[{ label: "Orders" }]}
      actions={
        <>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="Export orders as CSV"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </>
      }
    >
      {/* Filters */}
      <div className="mb-4">
        <AdminFilters
          filters={FILTER_CONFIG}
          values={{ search: filters.search, status: filters.status, dateFrom: filters.dateFrom }}
          onChange={handleFilterChange}
        />
      </div>

      {/* Table */}
      <AdminDataTable<OrderRow>
        columns={columns}
        data={data.orders}
        getRowKey={(item) => item.id}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        onRowClick={handleRowClick}
        emptyState={{
          title: "No orders found",
          description: "Try adjusting your filters or check back later.",
        }}
        bulkActions={
          <>
            <button
              onClick={() => setConfirmAction("ready")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Mark Ready
            </button>
            <button
              onClick={() => setConfirmAction("acknowledge")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Acknowledge
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
        title={confirmAction === "ready" ? "Mark as Ready?" : "Acknowledge Orders?"}
        description={(() => {
          const skipped = data.orders.filter((o) => {
            if (!selectedKeys.has(o.id)) return false;
            if (confirmAction === "acknowledge") return !!o.acknowledgedAt || o.status === "DELIVERED" || o.status === "CANCELLED";
            if (confirmAction === "ready") return o.status === "DELIVERED" || o.status === "CANCELLED" || o.status === "READY_FOR_DELIVERY" || o.status === "OUT_FOR_DELIVERY";
            return false;
          });
          const valid = selectedKeys.size - skipped.length;
          if (skipped.length > 0) return `${valid} order${valid !== 1 ? "s" : ""} will be updated. ${skipped.length} skipped (already processed).`;
          return `This will update ${selectedKeys.size} order${selectedKeys.size !== 1 ? "s" : ""}.`;
        })()}
        confirmLabel={confirmAction === "ready" ? "Mark Ready" : "Acknowledge"}
        variant="default"
      />
    </AdminPageShell>
  );
}
