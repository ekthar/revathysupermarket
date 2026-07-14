/**
 * Email service abstraction.
 * Checks the email_enabled feature flag before sending.
 * All functions are fire-and-forget: they catch errors, log them, and never throw.
 */

import { getFeatureFlag } from "@/lib/feature-flags";
import { sendEmailViaResend } from "@/lib/email/resend";
import {
  orderConfirmation,
  orderDispatched,
  orderDelivered,
  passwordReset,
} from "@/lib/email/templates";

type EmailConfig = {
  provider: string;
  fromEmail: string;
  fromName: string;
};

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type OrderEmailParams = {
  to: string;
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  deliveryAddress: string;
  eta?: string;
};

type DispatchedEmailParams = {
  to: string;
  orderNumber: string;
  customerName: string;
  riderName: string;
  trackingLink?: string;
};

type DeliveredEmailParams = {
  to: string;
  orderNumber: string;
  customerName: string;
};

type PasswordResetEmailParams = {
  to: string;
  name?: string;
  otp?: string;
  resetLink?: string;
};

async function getEmailConfig(): Promise<{ enabled: boolean; config: EmailConfig | null }> {
  const flag = await getFeatureFlag<EmailConfig>("email_enabled");
  return { enabled: flag.enabled, config: flag.config };
}

function formatFrom(config: EmailConfig): string {
  return `${config.fromName} <${config.fromEmail}>`;
}

/**
 * Send order confirmation email. Fire-and-forget.
 */
export async function sendOrderConfirmationEmail(params: OrderEmailParams): Promise<void> {
  try {
    const { enabled, config } = await getEmailConfig();
    if (!enabled || !config) return;

    const { subject, html } = orderConfirmation({
      orderNumber: params.orderNumber,
      customerName: params.customerName,
      items: params.items,
      total: params.total,
      deliveryAddress: params.deliveryAddress,
      eta: params.eta,
    });

    const result = await sendEmailViaResend({
      from: formatFrom(config),
      to: params.to,
      subject,
      html,
    });

    if (!result.success) {
      console.error("Order confirmation email failed:", result.error);
    }
  } catch (error) {
    console.error("Order confirmation email error:", error);
  }
}

/**
 * Send order dispatched email. Fire-and-forget.
 */
export async function sendOrderDispatchedEmail(params: DispatchedEmailParams): Promise<void> {
  try {
    const { enabled, config } = await getEmailConfig();
    if (!enabled || !config) return;

    const { subject, html } = orderDispatched({
      orderNumber: params.orderNumber,
      customerName: params.customerName,
      riderName: params.riderName,
      trackingLink: params.trackingLink,
    });

    const result = await sendEmailViaResend({
      from: formatFrom(config),
      to: params.to,
      subject,
      html,
    });

    if (!result.success) {
      console.error("Order dispatched email failed:", result.error);
    }
  } catch (error) {
    console.error("Order dispatched email error:", error);
  }
}

/**
 * Send order delivered email. Fire-and-forget.
 */
export async function sendOrderDeliveredEmail(params: DeliveredEmailParams): Promise<void> {
  try {
    const { enabled, config } = await getEmailConfig();
    if (!enabled || !config) return;

    const { subject, html } = orderDelivered({
      orderNumber: params.orderNumber,
      customerName: params.customerName,
    });

    const result = await sendEmailViaResend({
      from: formatFrom(config),
      to: params.to,
      subject,
      html,
    });

    if (!result.success) {
      console.error("Order delivered email failed:", result.error);
    }
  } catch (error) {
    console.error("Order delivered email error:", error);
  }
}

/**
 * Send password reset email. Fire-and-forget.
 */
export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
  try {
    const { enabled, config } = await getEmailConfig();
    if (!enabled || !config) return;

    const { subject, html } = passwordReset({
      name: params.name,
      otp: params.otp,
      resetLink: params.resetLink,
    });

    const result = await sendEmailViaResend({
      from: formatFrom(config),
      to: params.to,
      subject,
      html,
    });

    if (!result.success) {
      console.error("Password reset email failed:", result.error);
    }
  } catch (error) {
    console.error("Password reset email error:", error);
  }
}
