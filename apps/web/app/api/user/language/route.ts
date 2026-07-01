import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { locales } from "@/i18n/config";

const languageSchema = z.object({
  language: z.enum(locales as unknown as [string, ...string[]])
});

// PATCH /api/user/language
// Persists the user's preferred language to the database
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = languageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid language." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferredLanguage: parsed.data.language }
  });

  return NextResponse.json({ language: parsed.data.language });
}
