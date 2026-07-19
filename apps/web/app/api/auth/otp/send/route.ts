import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeIndianPhone, createOtpToken, countRecentOtps, otpRateLimitPer10Min } from "@/lib/otp";
import { sendOtpViaWhatsApp } from "@/lib/whatsapp";
import { sendOtpViaSms } from "@/lib/sms";
import { sendOtpViaTelegram } from "@/lib/telegram";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = String(body.phone ?? "").replace(/\D/g, "");
    const role = body.role as string | undefined;

    if (phone.length !== 10) {
      return NextResponse.json({ error: "Enter a valid 10-digit phone number" }, { status: 400 });
    }

    const normalizedPhone = normalizeIndianPhone(phone);

    // Distributed rate limiting: max 3 OTP requests per phone per 5 minutes
    const rl = await enforceRateLimit(`otp-send:${normalizedPhone}`, 3, 300);
    if (rl.limited) {
      return rateLimitResponse(rl.reset);
    }

    // If role filter is provided (e.g., DELIVERY_PARTNER), verify the user exists with that role
    if (role === "DELIVERY_PARTNER") {
      const user = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
        select: { role: true, isActive: true }
      });

      if (!user || user.role !== "DELIVERY_PARTNER") {
        return NextResponse.json(
          { error: "This number is not registered as a delivery partner. Contact admin." },
          { status: 403 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json({ error: "Account is deactivated. Contact admin." }, { status: 403 });
      }
    } else {
      // For general OTP login (customer flow), restrict to CUSTOMER role only
      // Unregistered phones are allowed (new customer signup)
      const existingUser = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
        select: { role: true }
      });

      if (existingUser && existingUser.role !== "CUSTOMER") {
        return NextResponse.json(
          { error: "OTP login is available for customers only. Please use staff login." },
          { status: 403 }
        );
      }
    }

    // Rate limiting
    const recentCount = await countRecentOtps(normalizedPhone);
    if (recentCount >= otpRateLimitPer10Min()) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 10 minutes." },
        { status: 429 }
      );
    }

    // Generate and store OTP
    const { otp, expiresAt } = await createOtpToken(normalizedPhone);

    // Check feature flags for delivery channels
    const whatsappEnabled = await isFeatureEnabled("whatsapp_enabled");
    const smsEnabled = await isFeatureEnabled("sms_enabled");
    const telegramEnabled = await isFeatureEnabled("telegram_enabled");

    const channels: string[] = [];

    // Send OTP via Telegram if enabled (fastest delivery)
    if (telegramEnabled) {
      try {
        const result = await sendOtpViaTelegram(normalizedPhone, otp);
        if (result.success) channels.push("Telegram");
      } catch (error) {
        console.error("Telegram OTP send failed:", error);
      }
    }

    // Send OTP via WhatsApp if enabled
    if (whatsappEnabled) {
      try {
        await sendOtpViaWhatsApp(normalizedPhone, otp);
        channels.push("WhatsApp");
      } catch (error) {
        console.error("WhatsApp OTP send failed:", error);
        // SMS fallback: if WhatsApp fails and SMS is enabled, auto-fallback
        if (smsEnabled && !channels.includes("SMS")) {
          try {
            const smsResult = await sendOtpViaSms(normalizedPhone, otp);
            if (smsResult.success) channels.push("SMS");
          } catch (smsError) {
            console.error("SMS fallback also failed:", smsError);
          }
        }
      }
    }

    // Send OTP via SMS if enabled (and not already sent as fallback)
    if (smsEnabled && !channels.includes("SMS")) {
      try {
        const result = await sendOtpViaSms(normalizedPhone, otp);
        if (result.success) channels.push("SMS");
      } catch (error) {
        console.error("SMS OTP send failed:", error);
      }
    }

    // If neither channel is enabled, log OTP to console when explicitly opted-in
    if (!whatsappEnabled && !smsEnabled) {
      if (process.env.EXPOSE_DEV_OTP === "true" && process.env.NODE_ENV !== "production") {
        console.log(`[DEV OTP] Phone: ${normalizedPhone}, OTP: ${otp}`);
      }
    }

    const message =
      channels.length > 0
        ? `OTP sent via ${channels.join(" and ")}`
        : "OTP generated";

    return NextResponse.json({
      success: true,
      message,
      expiresAt: expiresAt.toISOString(),
      // Only expose OTP in non-production environments with explicit opt-in
      ...(process.env.EXPOSE_DEV_OTP === "true" && process.env.NODE_ENV !== "production" ? { devOtp: otp } : {})
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
