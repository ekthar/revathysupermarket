import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeIndianPhone, createOtpToken, countRecentOtps, otpRateLimitPer10Min } from "@/lib/otp";
import { sendOtpViaWhatsApp } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = String(body.phone ?? "").replace(/\D/g, "");
    const role = body.role as string | undefined;

    if (phone.length !== 10) {
      return NextResponse.json({ error: "Enter a valid 10-digit phone number" }, { status: 400 });
    }

    const normalizedPhone = normalizeIndianPhone(phone);

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

    // Send OTP via WhatsApp (best effort)
    try {
      await sendOtpViaWhatsApp(normalizedPhone, otp);
    } catch (error) {
      console.error("WhatsApp OTP send failed:", error);
      // In development, log OTP to console
      if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV OTP] Phone: ${normalizedPhone}, OTP: ${otp}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your WhatsApp",
      expiresAt: expiresAt.toISOString(),
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {})
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
