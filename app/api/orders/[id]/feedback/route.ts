import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ orderRating: z.number().int().min(1).max(5), deliveryRating: z.number().int().min(1).max(5), tags: z.array(z.string().trim().min(1).max(40)).max(6).default([]), comment: z.string().trim().max(500).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose ratings between 1 and 5.", code: "INVALID_FEEDBACK" }, { status: 400 });
  const order = await prisma.order.findFirst({ where: { id, userId: session.user.id, status: "DELIVERED" }, select: { id: true } });
  if (!order) return NextResponse.json({ error: "Only delivered orders can be rated.", code: "ORDER_NOT_RATEABLE" }, { status: 409 });
  const feedback = await prisma.orderFeedback.upsert({ where: { orderId: id }, update: parsed.data, create: { ...parsed.data, orderId: id, userId: session.user.id } });
  return NextResponse.json({ feedback });
}
