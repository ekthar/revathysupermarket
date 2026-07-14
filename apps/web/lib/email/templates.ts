/**
 * Inline HTML email templates for transactional emails.
 * Each function returns { subject, html } for the given template type.
 */

import { SITE } from "@/lib/constants";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type OrderConfirmationParams = {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  deliveryAddress: string;
  eta?: string;
};

type OrderDispatchedParams = {
  orderNumber: string;
  customerName: string;
  riderName: string;
  trackingLink?: string;
};

type OrderDeliveredParams = {
  orderNumber: string;
  customerName: string;
};

type PasswordResetParams = {
  name?: string;
  otp?: string;
  resetLink?: string;
};

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SITE.name}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <tr>
      <td style="padding:24px 32px;background-color:#16a34a;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;">${SITE.name}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        ${content}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;background-color:#f4f4f5;text-align:center;font-size:12px;color:#71717a;">
        <p style="margin:0;">${SITE.name} | ${SITE.address}</p>
        <p style="margin:4px 0 0;">${SITE.phone ? `Phone: ${SITE.phone}` : ""}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function orderConfirmation(params: OrderConfirmationParams): { subject: string; html: string } {
  const itemsHtml = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;">${item.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;text-align:right;">&#8377;${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const content = `
    <h2 style="margin:0 0 16px;color:#18181b;">Order Confirmed!</h2>
    <p style="color:#3f3f46;margin:0 0 8px;">Hi ${params.customerName},</p>
    <p style="color:#3f3f46;margin:0 0 24px;">Thank you for your order. We have received it and will begin preparing it shortly.</p>
    <table style="width:100%;margin:0 0 16px;background-color:#f4f4f5;padding:12px;border-radius:8px;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 0;"><strong>Order Number:</strong></td><td style="text-align:right;">${params.orderNumber}</td></tr>
      <tr><td style="padding:4px 0;"><strong>Delivery Address:</strong></td><td style="text-align:right;">${params.deliveryAddress}</td></tr>
      ${params.eta ? `<tr><td style="padding:4px 0;"><strong>Estimated Delivery:</strong></td><td style="text-align:right;">${params.eta}</td></tr>` : ""}
    </table>
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px;" cellpadding="0" cellspacing="0">
      <thead>
        <tr style="border-bottom:2px solid #e4e4e7;">
          <th style="padding:8px 0;text-align:left;">Item</th>
          <th style="padding:8px 0;text-align:center;">Qty</th>
          <th style="padding:8px 0;text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <table style="width:100%;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;font-size:18px;"><strong>Total:</strong></td>
        <td style="padding:8px 0;font-size:18px;text-align:right;"><strong>&#8377;${params.total.toFixed(2)}</strong></td>
      </tr>
    </table>
    <p style="color:#71717a;margin:24px 0 0;font-size:14px;">We will notify you when your order is out for delivery.</p>
  `;

  return {
    subject: `Order Confirmed - ${params.orderNumber} | ${SITE.name}`,
    html: baseLayout(content),
  };
}

export function orderDispatched(params: OrderDispatchedParams): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 16px;color:#18181b;">Your Order is On Its Way!</h2>
    <p style="color:#3f3f46;margin:0 0 8px;">Hi ${params.customerName},</p>
    <p style="color:#3f3f46;margin:0 0 24px;">Great news! Your order <strong>${params.orderNumber}</strong> has been dispatched and is on its way to you.</p>
    <table style="width:100%;margin:0 0 24px;background-color:#f4f4f5;padding:12px;border-radius:8px;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 0;"><strong>Delivery Partner:</strong></td><td style="text-align:right;">${params.riderName}</td></tr>
    </table>
    ${
      params.trackingLink
        ? `<p style="text-align:center;margin:0 0 24px;"><a href="${params.trackingLink}" style="display:inline-block;padding:12px 24px;background-color:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Track Your Order</a></p>`
        : ""
    }
    <p style="color:#71717a;margin:0;font-size:14px;">Please keep your phone handy. Our delivery partner may contact you upon arrival.</p>
  `;

  return {
    subject: `Order Dispatched - ${params.orderNumber} | ${SITE.name}`,
    html: baseLayout(content),
  };
}

export function orderDelivered(params: OrderDeliveredParams): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 16px;color:#18181b;">Order Delivered!</h2>
    <p style="color:#3f3f46;margin:0 0 8px;">Hi ${params.customerName},</p>
    <p style="color:#3f3f46;margin:0 0 24px;">Your order <strong>${params.orderNumber}</strong> has been delivered successfully. We hope you enjoy your purchase!</p>
    <p style="text-align:center;margin:0 0 24px;"><a href="${SITE.url}/orders" style="display:inline-block;padding:12px 24px;background-color:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Rate Your Experience</a></p>
    <p style="color:#71717a;margin:0;font-size:14px;">Thank you for shopping with ${SITE.name}. We look forward to serving you again!</p>
  `;

  return {
    subject: `Order Delivered - ${params.orderNumber} | ${SITE.name}`,
    html: baseLayout(content),
  };
}

export function passwordReset(params: PasswordResetParams): { subject: string; html: string } {
  const greeting = params.name ? `Hi ${params.name},` : "Hi,";

  let actionContent = "";
  if (params.otp) {
    actionContent = `
      <p style="color:#3f3f46;margin:0 0 16px;">Use the following OTP to reset your password:</p>
      <p style="text-align:center;margin:0 0 24px;">
        <span style="display:inline-block;padding:16px 32px;background-color:#f4f4f5;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;color:#18181b;">${params.otp}</span>
      </p>
      <p style="color:#71717a;margin:0 0 8px;font-size:14px;">This OTP is valid for 10 minutes.</p>
    `;
  } else if (params.resetLink) {
    actionContent = `
      <p style="color:#3f3f46;margin:0 0 24px;">Click the button below to reset your password:</p>
      <p style="text-align:center;margin:0 0 24px;"><a href="${params.resetLink}" style="display:inline-block;padding:12px 24px;background-color:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a></p>
      <p style="color:#71717a;margin:0 0 8px;font-size:14px;">This link will expire in 1 hour.</p>
    `;
  }

  const content = `
    <h2 style="margin:0 0 16px;color:#18181b;">Password Reset Request</h2>
    <p style="color:#3f3f46;margin:0 0 8px;">${greeting}</p>
    <p style="color:#3f3f46;margin:0 0 24px;">We received a request to reset your password for your ${SITE.name} account.</p>
    ${actionContent}
    <p style="color:#71717a;margin:0;font-size:14px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
  `;

  return {
    subject: `Password Reset - ${SITE.name}`,
    html: baseLayout(content),
  };
}
