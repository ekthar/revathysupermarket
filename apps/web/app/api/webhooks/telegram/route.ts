/**
 * Telegram Bot Webhook
 * ════════════════════
 *
 * Handles incoming messages from the Telegram bot.
 * Users link their phone number by sending it to the bot.
 *
 * Flow:
 * 1. User starts bot and sends /start
 * 2. Bot asks for phone number
 * 3. User shares phone via contact button or types it
 * 4. We create/update TelegramLink record
 * 5. User can now receive OTP and notifications via Telegram
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeIndianPhone } from "@/lib/otp";

const TELEGRAM_API_BASE = "https://api.telegram.org";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

// Verify webhook secret (optional extra security)
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

async function replyToChat(chatId: string | number, text: string, replyMarkup?: object) {
  if (!BOT_TOKEN) return;
  await fetch(`${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  }).catch(() => {});
}

export async function POST(request: Request) {
  // Optional: verify webhook secret token from query params
  const url = new URL(request.url);
  const secretToken = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (WEBHOOK_SECRET && secretToken !== WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update = await request.json();

    // Handle /start command
    if (update.message?.text === "/start") {
      const chatId = update.message.chat.id;
      const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? "MSM Supermarket";

      await replyToChat(
        chatId,
        `Welcome to <b>${storeName}</b>! 🛒\n\nTo receive OTP codes and order updates here, please share your phone number using the button below.`,
        {
          keyboard: [[{ text: "📱 Share Phone Number", request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        }
      );
      return NextResponse.json({ ok: true });
    }

    // Handle shared contact (phone number)
    if (update.message?.contact) {
      const chatId = String(update.message.chat.id);
      const contact = update.message.contact;
      const phone = normalizeIndianPhone(contact.phone_number);
      const firstName = contact.first_name ?? update.message.from?.first_name ?? null;
      const username = update.message.from?.username ?? null;

      // Verify this contact belongs to the sender (prevent spoofing)
      if (contact.user_id !== update.message.from?.id) {
        await replyToChat(chatId, "Please share your own phone number, not someone else's.");
        return NextResponse.json({ ok: true });
      }

      // Create or update TelegramLink
      await prisma.telegramLink.upsert({
        where: { phone },
        create: {
          phone,
          chatId,
          username,
          firstName,
          isVerified: true,
        },
        update: {
          chatId,
          username,
          firstName,
          isVerified: true,
        },
      });

      await replyToChat(
        chatId,
        `✅ <b>Phone linked successfully!</b>\n\nYou'll now receive OTP codes and order updates here on Telegram.\n\nPhone: +${phone}`,
        { remove_keyboard: true }
      );

      return NextResponse.json({ ok: true });
    }

    // Handle typed phone number (fallback for users without contact button)
    if (update.message?.text && /^\d{10,12}$/.test(update.message.text.replace(/\D/g, ""))) {
      const chatId = String(update.message.chat.id);
      const phone = normalizeIndianPhone(update.message.text);
      const username = update.message.from?.username ?? null;
      const firstName = update.message.from?.first_name ?? null;

      await prisma.telegramLink.upsert({
        where: { phone },
        create: {
          phone,
          chatId,
          username,
          firstName,
          isVerified: true,
        },
        update: {
          chatId,
          username,
          firstName,
          isVerified: true,
        },
      });

      await replyToChat(
        chatId,
        `✅ <b>Phone linked!</b>\n\nYou'll receive OTPs and order updates here.\n\nLinked: +${phone}`
      );

      return NextResponse.json({ ok: true });
    }

    // Handle /unlink command
    if (update.message?.text === "/unlink") {
      const chatId = String(update.message.chat.id);

      await prisma.telegramLink.deleteMany({ where: { chatId } });
      await replyToChat(chatId, "Your phone has been unlinked. You won't receive messages here anymore.");

      return NextResponse.json({ ok: true });
    }

    // Handle /help command
    if (update.message?.text === "/help") {
      const chatId = update.message.chat.id;
      await replyToChat(
        chatId,
        `<b>Available commands:</b>\n\n/start — Link your phone number\n/unlink — Remove phone link\n/help — Show this help message\n\nOr just send your 10-digit phone number to link it.`
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
