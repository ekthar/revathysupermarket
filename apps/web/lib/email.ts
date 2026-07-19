/**
 * Email Notification Service
 * ══════════════════════════
 *
 * Sends transactional emails for order lifecycle events.
 * Uses Resend (default) or Nodemailer SMTP as provider.
 * Gated by "email_enabled" feature flag.
 *
 * Templates:
 * - Order confirmed
 * - Order packed / ready for delivery
 * - Order out for delivery
 * - Order delivered
 * - Order cancelled
 * - Password reset
 */

import { isFeatureEnabled, getFeatureFlag } from "@/lib/feature-flags";

type EmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type EmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

async function sendViaResend(params: EmailParams, fromEmail: string, fromName: string): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "Resend API key not configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data?.message ?? "Resend API error" };
    return { success: true, messageId: data.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Email send failed" };
  }
}

export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  const enabled = await isFeatureEnabled("email_enabled");
  if (!enabled) return { success: false, error: "Email notifications disabled" };

  const { config } = await getFeatureFlag<{ provider: string; fromEmail: string; fromName: string }>("email_enabled");
  const fromEmail = config?.fromEmail ?? "orders@store.com";
  const fromName = config?.fromName ?? process.env.NEXT_PUBLIC_STORE_NAME ?? "Store";

  return sendViaResend(params, fromEmail, fromName);
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderNumber: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  deliveryAddress: string;
}) {
  const { to, orderNumber, customerName, items, total, deliveryAddress } = params;
  if (!to) return { success: false, error: "No email address" };

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? "MSM Supermarket";
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const itemList = items.slice(0, 5).map((i) => `${i.name} x${i.quantity}`).join(", ");

  return sendEmail({
    to,
    subject: `Order #${orderNumber} confirmed - ${storeName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; font-weight: 800; color: #050505; margin: 0;">Order Confirmed! ✅</h1>
        <p style="color: #6B7280; margin-top: 8px;">Hi ${customerName}, your order <strong>#${orderNumber}</strong> has been received.</p>
        <div style="background: #F3F4F6; border-radius: 12px; padding: 16px; margin-top: 16px;">
          <p style="margin: 0; font-weight: 600;">${itemCount} item${itemCount > 1 ? "s" : ""}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #6B7280;">${itemList}${items.length > 5 ? "..." : ""}</p>
          <p style="margin: 8px 0 0; font-size: 20px; font-weight: 800;">₹${total.toFixed(2)}</p>
        </div>
        <p style="color: #6B7280; margin-top: 12px; font-size: 13px;">Delivering to: ${deliveryAddress}</p>
        <p style="color: #6B7280; margin-top: 16px; font-size: 14px;">We'll notify you when your order is ready for delivery.</p>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">— ${storeName}</p>
      </div>
    `,
    text: `Order #${orderNumber} confirmed. ${itemCount} items, ₹${total.toFixed(2)}. Delivering to: ${deliveryAddress}. - ${storeName}`,
  });
}

export async function sendOrderDeliveredEmail(email: string, orderNumber: string) {
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? "MSM Supermarket";
  return sendEmail({
    to: email,
    subject: `Order #${orderNumber} delivered - ${storeName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; font-weight: 800; color: #050505; margin: 0;">Delivered! 🎉</h1>
        <p style="color: #6B7280; margin-top: 8px;">Your order <strong>#${orderNumber}</strong> has been delivered.</p>
        <p style="color: #6B7280; font-size: 14px; margin-top: 16px;">Thank you for shopping with us! Rate your experience in the app.</p>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">— ${storeName}</p>
      </div>
    `,
    text: `Order #${orderNumber} delivered! Thank you for shopping with ${storeName}.`,
  });
}
