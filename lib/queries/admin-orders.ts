import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readApiResponse } from "@/lib/client-api";
import type { statusLabels } from "@/lib/constants";

export const ADMIN_ORDERS_QUERY_KEY = ["admin-orders"] as const;

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  total: number;
  status: keyof typeof statusLabels;
  deliveryPartnerId?: string | null;
  deliveryOtp?: string | null;
  deliveryOtpAttempts: number;
  deliveryOtpExpiresAt: string | null;
  staffNote?: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  items: Array<{ id: string; name: string; quantity: number; price: number; gstRate: number | null }>;
  whatsappLogs: Array<{ id: string; template: string; status: string; createdAt: string }>;
};

type RawApiOrder = AdminOrder & {
  houseName?: string;
  street?: string;
  landmark?: string;
  pincode?: string;
};

function normalizeOrder(order: RawApiOrder): AdminOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address ?? `${order.houseName ?? ""}, ${order.street ?? ""}, ${order.landmark ?? ""}, ${order.pincode ?? ""}`,
    total: Number(order.total),
    status: order.status,
    deliveryPartnerId: order.deliveryPartnerId ?? null,
    deliveryOtp: order.deliveryOtp,
    deliveryOtpAttempts: order.deliveryOtpAttempts ?? 0,
    deliveryOtpExpiresAt: order.deliveryOtpExpiresAt ?? null,
    staffNote: order.staffNote,
    acknowledgedAt: order.acknowledgedAt ?? null,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price),
      gstRate: item.gstRate ?? null,
    })),
    whatsappLogs: order.whatsappLogs ?? [],
  };
}
export function useAdminOrders(initialOrders: AdminOrder[]) {
  return useQuery({
    queryKey: ADMIN_ORDERS_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await readApiResponse<{ orders?: RawApiOrder[] }>(res);
      if (!res.ok || !data.orders) throw new Error("Failed to fetch orders");
      return data.orders.map(normalizeOrder);
    },
    initialData: initialOrders,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}

export function useAcknowledgeOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/admin/orders/${orderId}/acknowledge`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to acknowledge order");
      return orderId;
    },
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_ORDERS_QUERY_KEY });
      const previous = queryClient.getQueryData<AdminOrder[]>(ADMIN_ORDERS_QUERY_KEY);
      queryClient.setQueryData<AdminOrder[]>(ADMIN_ORDERS_QUERY_KEY, (old) =>
        old?.map((order) =>
          order.id === orderId
            ? { ...order, acknowledgedAt: new Date().toISOString() }
            : order
        ) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ADMIN_ORDERS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_QUERY_KEY });
    },
  });
}

export function useAssignDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, deliveryPartnerId }: { orderId: string; deliveryPartnerId: string }) => {
      const res = await fetch(`/api/admin/orders/${orderId}/delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryPartnerId: deliveryPartnerId || null }),
      });
      if (!res.ok) throw new Error("Delivery assignment failed");
      return { orderId, deliveryPartnerId };
    },
    onMutate: async ({ orderId, deliveryPartnerId }) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_ORDERS_QUERY_KEY });
      const previous = queryClient.getQueryData<AdminOrder[]>(ADMIN_ORDERS_QUERY_KEY);
      queryClient.setQueryData<AdminOrder[]>(ADMIN_ORDERS_QUERY_KEY, (old) =>
        old?.map((order) =>
          order.id === orderId
            ? { ...order, deliveryPartnerId: deliveryPartnerId || null }
            : order
        ) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ADMIN_ORDERS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_QUERY_KEY });
    },
  });
}

export function useRegenerateOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/admin/orders/${orderId}/delivery-otp`, { method: "POST" });
      const data = await readApiResponse<{ error?: string; order?: { deliveryOtp?: string | null; deliveryOtpExpiresAt?: string | null } }>(res);
      if (!res.ok || !data.order) throw new Error(data.error ?? "OTP regenerate failed");
      return { orderId, ...data.order };
    },
    onSuccess: (data) => {
      queryClient.setQueryData<AdminOrder[]>(ADMIN_ORDERS_QUERY_KEY, (old) =>
        old?.map((order) =>
          order.id === data.orderId
            ? {
                ...order,
                deliveryOtp: data.deliveryOtp,
                deliveryOtpExpiresAt: data.deliveryOtpExpiresAt ?? null,
                deliveryOtpAttempts: 0,
              }
            : order
        ) ?? []
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_QUERY_KEY });
    },
  });
}
