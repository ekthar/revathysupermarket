import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { CustomerService } from "@/lib/services";
import { AdminAccessDenied } from "@/components/admin/shared";
import { CustomersPageClient } from "@/components/admin/customers";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
  }>;
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "customers.view")) {
    return <AdminAccessDenied permission="customers.view" />;
  }

  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(params.pageSize || "20", 10) || 20));

  const result = await CustomerService.list({
    page,
    pageSize,
    search: params.search || undefined,
  });

  // Fetch loyalty data for each customer
  const customersWithLoyalty = await Promise.all(
    result.customers.map(async (c) => {
      let loyaltyPoints = 0;
      let lastOrderDate: string | null = null;

      try {
        const detail = await CustomerService.getById(c.id);
        loyaltyPoints = detail.loyaltyAccount?.balance ?? 0;
        if (detail.recentOrders.length > 0) {
          lastOrderDate = detail.recentOrders[0].createdAt.toISOString();
        }
      } catch {
        // Graceful fallback
      }

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        orderCount: c.orderCount,
        totalSpent: c.totalSpent,
        loyaltyPoints,
        lastOrderDate,
        isActive: c.isActive,
      };
    })
  );

  return (
    <CustomersPageClient
      data={{
        customers: customersWithLoyalty,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      }}
      filters={{ search: params.search || "" }}
    />
  );
}
