import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";

/**
 * Send OTP to a phone number via WhatsApp Business API.
 * Falls back gracefully if WhatsApp is not configured.
 */
export async function sendOtpViaWhatsApp(phone: string, otp: string) {
  return sendWhatsAppTemplate({
    to: phone,
    template: "login_otp",
    params: [otp]
  });
}
