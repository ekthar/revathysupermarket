import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { OrderService } from "@/lib/services";
import { AdminAccessDenied } from "@/components/admin/shared";
import { OrdersPageClient } from "@/components/admin/orders";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "orders.view")) {
    return <AdminAccessDenied permission="orders.view" />;
  }

  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(params.pageSize || "20", 10) || 20));

  const result = await OrderService.list({
    page,
    pageSize,
    status: params.status || undefined,
    search: params.search || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
  });

  // Serialize dates for client
  const serialized = {
    orders: result.orders.map((o) => ({
      ...o,
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
      acknowledgedAt: o.acknowledgedAt?.toISOString() ?? null,
      deliveryPartner: o.deliveryPartner,
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };

  return (
    <OrdersPageClient
      data={serialized}
      filters={{
        status: params.status || "",
        search: params.search || "",
        dateFrom: params.dateFrom || "",
      }}
    />
  );
}
