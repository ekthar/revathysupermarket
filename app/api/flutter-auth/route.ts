import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { normalizeIndianPhone, verifyLatestOtp } from "@/lib/otp";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await enforceRateLimit(`flutter-auth:${ip}`, 10, 60);
  if (rl.limited) {
    return rateLimitResponse(rl.reset);
  }

  let body: { phone?: string; otp?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { phone: rawPhone, otp, name } = body;

  if (!rawPhone || !otp) {
    return NextResponse.json({ error: "Phone and OTP are required." }, { status: 400 });
  }

  const phone = normalizeIndianPhone(rawPhone);

  if (!/^91\d{10}$/.test(phone) || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: "Invalid phone or OTP format." }, { status: 400 });
  }

  const verified = await verifyLatestOtp(phone, otp);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { phone },
    create: {
      name: name?.trim() || null,
      phone,
      phoneVerified: true,
      role: "CUSTOMER",
      isActive: true,
      lastLoginAt: new Date()
    },
    update: {
      name: name?.trim() || undefined,
      phoneVerified: true,
      isActive: true,
      lastLoginAt: new Date()
    }
  });

  if (!user.isActive) {
    return NextResponse.json({ error: "Account is disabled." }, { status: 401 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone },
    secret,
    { expiresIn: "30d" }
  );

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
}
