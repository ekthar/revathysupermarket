import { SITE } from "@/lib/constants";

/**
 * SMS message templates for order lifecycle events.
 * Each function returns a short SMS string suitable for transactional messaging.
 */

export function orderConfirmed(orderNumber: string, total: number, eta?: string): string {
  const etaPart = eta ? ` ETA: ${eta}.` : "";
  return `${SITE.name}: Your order ${orderNumber} for Rs.${total.toFixed(0)} has been confirmed!${etaPart} Thank you for shopping with us.`;
}

export function orderDispatched(orderNumber: string, riderName?: string): string {
  const riderPart = riderName ? ` ${riderName} is` : " Your delivery partner is";
  return `${SITE.name}: Your order ${orderNumber} is on the way!${riderPart} heading to you now. Please keep your phone handy.`;
}

export function orderDelivered(orderNumber: string): string {
  return `${SITE.name}: Your order ${orderNumber} has been delivered. Thank you for shopping with us! We hope to serve you again soon.`;
}
