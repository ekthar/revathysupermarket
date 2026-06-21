import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const schema = z.object({ orderId: z.string().optional(), subject: z.string().trim().min(4).max(120), message: z.string().trim().min(4).max(2000), priority: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL") });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const tickets = await prisma.supportTicket.findMany({ where: { customerId: session.user.id }, include: { messages: { orderBy: { createdAt: "asc" }, take: 1 } }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const limit = await enforceRateLimit(`support:${session.user.id}`, 10, 3600);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the support request details.", code: "INVALID_SUPPORT_REQUEST", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.orderId) {
    const owned = await prisma.order.count({ where: { id: parsed.data.orderId, userId: session.user.id } });
    if (!owned) return NextResponse.json({ error: "Order not found.", code: "ORDER_NOT_FOUND" }, { status: 404 });
  }
  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.supportTicket.create({ data: { ticketNumber: `SUP-${Date.now()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, customerId: session.user.id, orderId: parsed.data.orderId, subject: parsed.data.subject, priority: parsed.data.priority } });
    await tx.supportMessage.create({ data: { ticketId: created.id, authorId: session.user.id, body: parsed.data.message } });
    return created;
  });
  return NextResponse.json({ ticket }, { status: 201 });
}
