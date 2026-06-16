import { SITE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type WhatsAppOrder = {
  orderNumber: string;
  customerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
};

export function buildWhatsAppMessage(order: WhatsAppOrder) {
  const lines = [
    `Hello Revathy Supermarket, I have placed Order #${order.orderNumber}.`,
    "",
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `WhatsApp: ${order.whatsapp}`,
    `Address: ${order.address}`,
    "",
    "Products:",
    ...order.items.map(
      (item) => `- ${item.name} x ${item.quantity} = ${formatCurrency(item.price * item.quantity)}`
    ),
    "",
    `Total: ${formatCurrency(order.total)}`
  ];

  return lines.join("\n");
}

export function buildWhatsAppUrl(order: WhatsAppOrder) {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`;
}
