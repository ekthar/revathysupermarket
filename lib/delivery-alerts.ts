/**
 * Utility to push real-time alerts to connected delivery partners.
 * Works alongside the push notification system for comprehensive alerting.
 */

type AlertPayload = {
  type: "new_order";
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    address: string;
    total: number;
  };
};

/**
 * Send a real-time SSE alert to a delivery partner.
 * Also triggers push notification as a fallback for when the app is in background.
 */
export function sendDeliveryAlert(partnerId: string, payload: AlertPayload) {
  const controllers = (globalThis as Record<string, unknown>).__deliveryAlertControllers as Map<string, Set<ReadableStreamDefaultController>> | undefined;

  if (!controllers?.has(partnerId)) return false;

  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(payload)}\n\n`;

  let sent = false;
  const partnerControllers = controllers.get(partnerId);
  if (partnerControllers) {
    for (const controller of partnerControllers) {
      try {
        controller.enqueue(encoder.encode(message));
        sent = true;
      } catch {
        partnerControllers.delete(controller);
      }
    }
  }

  return sent;
}

/**
 * Notify all delivery partners about a new unassigned order (for pickup).
 * Used when an order becomes ready and no specific partner is assigned yet.
 */
export function broadcastToAllDeliveryPartners(payload: AlertPayload) {
  const controllers = (globalThis as Record<string, unknown>).__deliveryAlertControllers as Map<string, Set<ReadableStreamDefaultController>> | undefined;

  if (!controllers) return;

  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(payload)}\n\n`;

  for (const [, partnerControllers] of controllers) {
    for (const controller of partnerControllers) {
      try {
        controller.enqueue(encoder.encode(message));
      } catch {
        partnerControllers.delete(controller);
      }
    }
  }
}
