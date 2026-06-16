import { prisma } from "@/lib/prisma";
import { AdminOrdersClient } from "@/components/admin/admin-orders-client";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50
  }).catch(() => []);

  return (
    <AdminOrdersClient
      orders={orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        whatsapp: order.whatsapp,
        address: `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`,
        total: Number(order.total),
        status: order.status,
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price)
        }))
      }))}
    />
  );
}
