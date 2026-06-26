import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const schema = z.object({ message: z.string().trim().min(1).max(2000) });

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const ticket = await prisma.supportTicket.findFirst({ where: { id, customerId: session.user.id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found.", code: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const limit = await enforceRateLimit(`support:message:${session.user.id}`, 30, 300);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Message is required.", code: "INVALID_MESSAGE" }, { status: 400 });
  const ticket = await prisma.supportTicket.findFirst({ where: { id, customerId: session.user.id } });
  if (!ticket || ["CLOSED", "RESOLVED"].includes(ticket.status)) return NextResponse.json({ error: "This ticket cannot be updated.", code: "TICKET_CLOSED" }, { status: 409 });
  const message = await prisma.supportMessage.create({ data: { ticketId: id, authorId: session.user.id, body: parsed.data.message } });
  await prisma.supportTicket.update({ where: { id }, data: { status: "OPEN" } });
  return NextResponse.json({ message }, { status: 201 });
}
