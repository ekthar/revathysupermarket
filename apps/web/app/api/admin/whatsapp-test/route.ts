import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canManageSettings } from "@/lib/authz";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";

const schema = z.object({
  phone: z.string().min(10)
});

export async function POST(request: Request) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });

  const result = await sendWhatsAppTemplate({
    to: parsed.data.phone,
    template: "login_otp",
    params: ["123456"]
  });
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
