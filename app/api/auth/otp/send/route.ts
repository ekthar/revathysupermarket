import { NextResponse } from "next/server";
import { z } from "zod";
import { countRecentOtps, createOtpToken, normalizeIndianPhone, otpRateLimitPer10Min } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";

const schema = z.object({
  phone: z.string().min(10)
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limit = rateLimit(`otp-send:${ip}`, 12);
  if (limit.limited) return NextResponse.json({ error: "Too many OTP requests. Please try again shortly." }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid WhatsApp phone number." }, { status: 400 });

  const phone = normalizeIndianPhone(parsed.data.phone);
  if (!/^91\d{10}$/.test(phone)) return NextResponse.json({ error: "Enter a valid 10-digit Indian phone number." }, { status: 400 });

  const recentCount = await countRecentOtps(phone);
  if (recentCount >= otpRateLimitPer10Min()) {
    return NextResponse.json({ error: "You have requested too many codes. Please wait a few minutes." }, { status: 429 });
  }

  const { otp } = await createOtpToken(phone);
  await sendWhatsAppTemplate({ to: phone, template: "login_otp", params: [otp] });
  return NextResponse.json({ success: true, expiresIn: 300 });
}
