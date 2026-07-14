import { prisma } from "@/lib/prisma";
import { AdminOrdersClient } from "@/components/admin/admin-orders-client";
import { getActiveDeliveryOtp } from "@/lib/delivery";

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
      deliveryInstructions: true,
      staffNote: true,
      billNumber: true,
      acknowledgedAt: true,
      printedAt: true,
      printCount: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          price: true,
          gstRate: true,
          product: {
            select: { unit: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 200
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

  // Fetch print_required_alert threshold for unprinted order warnings
  const printAlertFlag = await prisma.featureFlag.findUnique({ where: { key: "print_required_alert" } }).catch(() => null);
  const printAlertEnabled = printAlertFlag?.enabled ?? false;
  const printAlertThresholdMinutes = (printAlertFlag?.config as { thresholdMinutes?: number } | null)?.thresholdMinutes ?? 10;

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
      printAlertEnabled={printAlertEnabled}
      printAlertThresholdMinutes={printAlertThresholdMinutes}
      orders={orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        address: `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`,
        total: Number(order.total),
        status: order.status,
        deliveryPartnerId: order.deliveryPartnerId,
        deliveryOtp: getActiveDeliveryOtp(order.deliveryOtp, order.deliveryOtpExpiresAt),
        deliveryOtpAttempts: order.deliveryOtpAttempts,
        deliveryOtpExpiresAt: order.deliveryOtpExpiresAt?.toISOString() ?? null,
        deliveryInstructions: order.deliveryInstructions,
        staffNote: order.staffNote,
        billNumber: order.billNumber ?? null,
        acknowledgedAt: order.acknowledgedAt?.toISOString() ?? null,
        printedAt: order.printedAt?.toISOString() ?? null,
        printCount: order.printCount ?? 0,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          gstRate: item.gstRate ? Number(item.gstRate) : null,
          unit: item.product?.unit ?? "pcs"
        })),
        whatsappLogs: logsByOrder.get(order.id) ?? []
      }))}
    />
  );
}
