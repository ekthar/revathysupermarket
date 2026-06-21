import { NextResponse } from "next/server";
import { z } from "zod";
import { countRecentOtps, createOtpToken, normalizeIndianPhone, otpRateLimitPer10Min } from "@/lib/otp";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { clientIp } from "@/lib/request-security";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";

const schema = z.object({
  phone: z.string().min(10)
});

export async function POST(request: Request) {
  const limit = await enforceRateLimit(`otp-send:${clientIp(request)}`, 12, 600);
  if (limit.limited) return rateLimitResponse(limit.reset);

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
