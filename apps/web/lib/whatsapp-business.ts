import { prisma } from "@/lib/prisma";

export type WhatsAppTemplate =
  | "login_otp"
  | "order_confirmed"
  | "order_packed"
  | "delivery_assigned"
  | "out_for_delivery"
  | "delivered"
  | "order_edited"
  | "return_approved";

type SendParams = {
  to: string;
  template: WhatsAppTemplate;
  params: string[];
  orderId?: string;
};

function normalizeToWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export async function sendWhatsAppTemplate(params: SendParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_API_TOKEN;
  const to = normalizeToWhatsAppPhone(params.to);

  if (!phoneNumberId || !token) {
    await prisma.whatsAppLog.create({
      data: {
        phone: to,
        orderId: params.orderId,
        template: params.template,
        status: "failed",
        error: "WhatsApp Business API is not configured.",
        statusAt: new Date()
      }
    }).catch(() => null);
    return { success: false, error: "WhatsApp Business API is not configured." };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: params.template,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: params.params.map((value) => ({ type: "text", text: String(value) }))
            }
          ]
        }
      })
    });
    const data = await response.json().catch(() => ({}));
    const messageId = data?.messages?.[0]?.id as string | undefined;
    if (!response.ok) {
      const error = data?.error?.message ?? "WhatsApp message failed.";
      await prisma.whatsAppLog.create({
        data: { phone: to, orderId: params.orderId, template: params.template, status: "failed", error, statusAt: new Date() }
      }).catch(() => null);
      return { success: false, error };
    }

    await prisma.whatsAppLog.create({
      data: { phone: to, orderId: params.orderId, template: params.template, messageId, status: "sent", statusAt: new Date() }
    }).catch(() => null);
    return { success: true, messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "WhatsApp message failed.";
    await prisma.whatsAppLog.create({
      data: { phone: to, orderId: params.orderId, template: params.template, status: "failed", error: message, statusAt: new Date() }
    }).catch(() => null);
    return { success: false, error: message };
  }
}

export async function updateWhatsAppMessageStatus(messageId: string, status: string) {
  await prisma.whatsAppLog.updateMany({
    where: { messageId },
    data: { status, statusAt: new Date() }
  });
}
