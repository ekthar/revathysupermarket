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

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN ?? "";
}

async function replyToChat(chatId: string | number, text: string, replyMarkup?: object) {
  const token = getBotToken();
  if (!token) {
    console.error("[Telegram] BOT_TOKEN not set, cannot reply");
    return;
  }

  const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  }).catch((err) => {
    console.error("[Telegram] replyToChat fetch failed:", err);
    return null;
  });

  if (res && !res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[Telegram] sendMessage failed:", res.status, body);
  }
}

export async function POST(request: Request) {
  // Verify webhook secret if configured — but don't block if not set
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
    if (secretToken && secretToken !== webhookSecret) {
      console.error("[Telegram] Webhook secret mismatch");
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: any;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  // Log for debugging
  console.log("[Telegram] Received update:", JSON.stringify(update).slice(0, 500));

  try {
    const message = update.message;
    if (!message) {
      // Could be callback_query, edited_message, etc — ignore
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat?.id;
    if (!chatId) return NextResponse.json({ ok: true });

    const text = message.text?.trim() ?? "";

    // Handle /start command
    if (text === "/start") {
      const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? "MSM Supermarket";

      await replyToChat(
        chatId,
        `Welcome to <b>${storeName}</b>! 🛒\n\nTo receive OTP codes and order updates here, please share your phone number using the button below.\n\nOr simply type your 10-digit phone number.`,
        {
          keyboard: [[{ text: "📱 Share Phone Number", request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        }
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /help command
    if (text === "/help") {
      await replyToChat(
        chatId,
        `<b>Available commands:</b>\n\n/start — Link your phone number\n/unlink — Remove phone link\n/help — Show this help message\n\nOr just send your 10-digit phone number to link it.`
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /unlink command
    if (text === "/unlink") {
      try {
        await prisma.telegramLink.deleteMany({ where: { chatId: String(chatId) } });
      } catch (e) {
        console.error("[Telegram] unlink DB error:", e);
      }
      await replyToChat(chatId, "Your phone has been unlinked. You won't receive messages here anymore.");
      return NextResponse.json({ ok: true });
    }

    // Handle shared contact (phone number via button)
    if (message.contact) {
      const contact = message.contact;
      const phone = normalizeIndianPhone(contact.phone_number ?? "");
      const firstName = contact.first_name ?? message.from?.first_name ?? null;
      const username = message.from?.username ?? null;

      if (!phone || phone.length < 10) {
        await replyToChat(chatId, "Could not read your phone number. Please type your 10-digit number manually.");
        return NextResponse.json({ ok: true });
      }

      // Verify this contact belongs to the sender (prevent spoofing)
      if (contact.user_id && contact.user_id !== message.from?.id) {
        await replyToChat(chatId, "Please share your own phone number, not someone else's.");
        return NextResponse.json({ ok: true });
      }

      try {
        await prisma.telegramLink.upsert({
          where: { phone },
          create: {
            phone,
            chatId: String(chatId),
            username,
            firstName,
            isVerified: true,
          },
          update: {
            chatId: String(chatId),
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
      } catch (dbError) {
        console.error("[Telegram] DB upsert error:", dbError);
        await replyToChat(
          chatId,
          `✅ Phone received: +${phone}\n\nNote: There was a database issue saving your link. Please try again later or contact support.`
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Handle typed phone number (10-12 digits)
    const digits = text.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 12) {
      const phone = normalizeIndianPhone(digits);
      const username = message.from?.username ?? null;
      const firstName = message.from?.first_name ?? null;

      try {
        await prisma.telegramLink.upsert({
          where: { phone },
          create: {
            phone,
            chatId: String(chatId),
            username,
            firstName,
            isVerified: true,
          },
          update: {
            chatId: String(chatId),
            username,
            firstName,
            isVerified: true,
          },
        });

        await replyToChat(
          chatId,
          `✅ <b>Phone linked!</b>\n\nYou'll receive OTPs and order updates here.\n\nLinked: +${phone}`
        );
      } catch (dbError) {
        console.error("[Telegram] DB upsert error:", dbError);
        await replyToChat(chatId, `Received phone +${phone} but failed to save. The TelegramLink table may need to be created. Please run: npx prisma db push`);
      }

      return NextResponse.json({ ok: true });
    }

    // Unknown message — provide help
    if (text && !text.startsWith("/")) {
      await replyToChat(
        chatId,
        `I didn't understand that. Please send your 10-digit phone number or use /start to begin.`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
