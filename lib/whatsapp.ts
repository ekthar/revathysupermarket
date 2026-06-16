import { SITE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type WhatsAppOrder = {
  orderNumber: string;
  total: number;
  billUrl?: string;
};

export function buildWhatsAppMessage(order: WhatsAppOrder) {
  const lines = [
    `Hello Revathy Supermarket, I have placed Order #${order.orderNumber}. Please find my order bill attached/shared.`,
    "",
    `Total: ${formatCurrency(order.total)}`
  ];
  if (order.billUrl) lines.push(`Bill: ${order.billUrl}`);

  return lines.join("\n");
}

export function buildWhatsAppUrl(order: WhatsAppOrder, whatsappNumber = SITE.whatsapp) {
  return `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`;
}
