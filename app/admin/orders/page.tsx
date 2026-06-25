import { prisma } from "@/lib/prisma";
import { AdminOrdersClient } from "@/components/admin/admin-orders-client";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      phone: true,
      houseName: true,
      street: true,
      landmark: true,
      pincode: true,
      total: true,
      status: true,
      deliveryPartnerId: true,
      deliveryOtp: true,
      deliveryOtpAttempts: true,
      deliveryOtpExpiresAt: true,
      staffNote: true,
      billNumber: true,
      acknowledgedAt: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          price: true,
          gstRate: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  }).catch(() => []);
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, price: true, discountPrice: true },
    orderBy: { name: "asc" },
    take: 300
  }).catch(() => []);
  const deliveryPartners = await prisma.user.findMany({
    where: { role: "DELIVERY_PARTNER", isActive: true },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" }
  }).catch(() => []);
  const orderIds = orders.map((order) => order.id);
  const whatsappLogs = orderIds.length > 0
    ? await prisma.whatsAppLog.findMany({
        where: { orderId: { in: orderIds } },
        select: { id: true, orderId: true, template: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 200
      }).catch(() => [])
    : [];
  const logsByOrder = new Map<string, Array<{ id: string; template: string; status: string; createdAt: string }>>();
  for (const log of whatsappLogs) {
    if (!log.orderId) continue;
    logsByOrder.set(log.orderId, [
      ...(logsByOrder.get(log.orderId) ?? []),
      { id: log.id, template: log.template, status: log.status, createdAt: log.createdAt.toISOString() }
    ]);
  }

  return (
    <AdminOrdersClient
      deliveryPartners={deliveryPartners.map((partner) => ({
        id: partner.id,
        name: partner.name ?? partner.phone ?? "Delivery partner"
      }))}
      products={products.map((product) => ({
        id: product.id,
        name: product.name,
        price: Number(product.discountPrice ?? product.price)
      }))}
      orders={orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        address: `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`,
        total: Number(order.total),
        status: order.status,
        deliveryPartnerId: order.deliveryPartnerId,
        deliveryOtp: order.deliveryOtp,
        deliveryOtpAttempts: order.deliveryOtpAttempts,
        deliveryOtpExpiresAt: order.deliveryOtpExpiresAt?.toISOString() ?? null,
        staffNote: order.staffNote,
        billNumber: order.billNumber ?? null,
        acknowledgedAt: order.acknowledgedAt?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          gstRate: item.gstRate ? Number(item.gstRate) : null
        })),
        whatsappLogs: logsByOrder.get(order.id) ?? []
      }))}
    />
  );
}
