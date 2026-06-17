import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "local";
    const limit = rateLimit(`register:${ip}`, 5);
    if (limit.limited) return NextResponse.json({ error: "Too many registration attempts." }, { status: 429 });

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join(".");
      return NextResponse.json(
        { error: field ? `${field}: ${issue.message}` : "Please check the registration details." },
        { status: 400 }
      );
    }

    const email = parsed.data.email?.trim() || undefined;
    const phone = parsed.data.phone?.replace(/\D/g, "") || undefined;
    if (!email && !phone) return NextResponse.json({ error: "Email or phone is required." }, { status: 400 });
    if (email && !parsed.data.password) return NextResponse.json({ error: "Password is required for email registration." }, { status: 400 });
    const existing = await prisma.user.findFirst({
      where: { OR: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])] }
    });
    if (existing) return NextResponse.json({ error: "An account already exists for this phone or email." }, { status: 409 });

    const passwordHash = parsed.data.password ? await bcrypt.hash(parsed.data.password, 12) : undefined;
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        phone,
        phoneVerified: false,
        passwordHash
      },
      select: { id: true, name: true, email: true }
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
