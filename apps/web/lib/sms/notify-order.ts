import { isFeatureEnabled } from "@/lib/feature-flags";
import { sendSms } from "@/lib/sms";
import { orderConfirmed, orderDispatched, orderDelivered } from "@/lib/sms/templates";

export type SmsOrderEvent = "confirmed" | "dispatched" | "delivered";

type NotifyOrderSmsData = {
  orderNumber: string;
  total?: number;
  eta?: string;
  riderName?: string;
};

/**
 * Fire-and-forget SMS notification for order lifecycle events.
 * Checks sms_enabled feature flag before sending.
 * Never throws - catches all errors internally.
 */
export async function notifyOrderSms(
  event: SmsOrderEvent,
  phone: string,
  data: NotifyOrderSmsData,
): Promise<void> {
  try {
    const enabled = await isFeatureEnabled("sms_enabled");
    if (!enabled) return;

    if (!phone) return;

    let message: string;

    switch (event) {
      case "confirmed":
        message = orderConfirmed(data.orderNumber, data.total ?? 0, data.eta);
        break;
      case "dispatched":
        message = orderDispatched(data.orderNumber, data.riderName);
        break;
      case "delivered":
        message = orderDelivered(data.orderNumber);
        break;
      default:
        return;
    }

    await sendSms({ to: phone, message, orderId: undefined });
  } catch (error) {
    console.error(`SMS notification (${event}) failed:`, error);
  }
}
