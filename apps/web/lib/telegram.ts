/**
 * Telegram Bot OTP Sender
 * ═══════════════════════
 *
 * Sends OTP codes via Telegram Bot API.
 * Requires:
 * - TELEGRAM_BOT_TOKEN: Bot API token from @BotFather
 * - The user must have started a conversation with the bot first
 *
 * Flow:
 * 1. User provides phone number
 * 2. We look up chat_id from TelegramLink table (user must have linked account)
 * 3. Send OTP via bot.sendMessage
 *
 * For new users who haven't linked Telegram yet, this channel is skipped
 * and falls back to WhatsApp/SMS.
 */

import { prisma } from "@/lib/prisma";
import { normalizeIndianPhone } from "@/lib/otp";

const TELEGRAM_API_BASE = "https://api.telegram.org";

type TelegramResult = {
  success: boolean;
  messageId?: number;
  error?: string;
};

/**
 * Send a message to a Telegram chat via Bot API.
 */
async function sendTelegramMessage(chatId: string, text: string): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return { success: false, error: "Telegram bot token not configured" };
  }

  try {
    const response = await fetch(
      `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
      const error = data.description ?? "Telegram API call failed";
      console.error("[Telegram] Send failed:", error);
      return { success: false, error };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Telegram send failed";
    console.error("[Telegram] Error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Send OTP via Telegram to a user linked by phone number.
 * Returns success: false if user has no Telegram chat linked.
 */
export async function sendOtpViaTelegram(phone: string, otp: string): Promise<TelegramResult> {
  // Normalize phone to match TelegramLink storage format (e.g. "918086728253")
  const normalizedPhone = normalizeIndianPhone(phone);

  // Look up user's Telegram chat ID from their linked account
  const link = await prisma.telegramLink.findUnique({
    where: { phone: normalizedPhone },
    select: { chatId: true, isVerified: true },
  }).catch(() => null);

  if (!link || !link.isVerified) {
    return { success: false, error: "No verified Telegram account linked to this phone" };
  }

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? "MSM Supermarket";

  const message = [
    `🔐 <b>Your verification code</b>`,
    ``,
    `<code>${otp}</code>`,
    ``,
    `This code expires in 5 minutes.`,
    `Do not share it with anyone.`,
    ``,
    `— ${storeName}`,
  ].join("\n");

  return sendTelegramMessage(link.chatId, message);
}

/**
 * Send order update notification via Telegram.
 */
export async function sendTelegramNotification(
  phone: string,
  title: string,
  body: string
): Promise<TelegramResult> {
  // Normalize phone to match TelegramLink storage format (e.g. "918086728253")
  const normalizedPhone = normalizeIndianPhone(phone);

  const link = await prisma.telegramLink.findUnique({
    where: { phone: normalizedPhone },
    select: { chatId: true, isVerified: true },
  }).catch(() => null);

  if (!link || !link.isVerified) {
    return { success: false, error: `No Telegram link for phone ${normalizedPhone}` };
  }

  const message = `<b>${title}</b>\n\n${body}`;
  return sendTelegramMessage(link.chatId, message);
}
