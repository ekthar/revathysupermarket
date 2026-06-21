import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewReports } from "@/lib/authz";
import { createNotification } from "@/lib/notifications";

const schema = z.object({ id: z.string(), status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"]), reply: z.string().trim().max(2000).optional() });

export async function GET() {
  const session = await auth();
  if (!canViewReports(session?.user?.role)) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const tickets = await prisma.supportTicket.findMany({ include: { customer: { select: { name: true, phone: true } }, messages: { orderBy: { createdAt: "asc" } } }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }], take: 100 });
  return NextResponse.json({ tickets });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !canViewReports(session.user.role)) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid support update.", code: "INVALID_SUPPORT_UPDATE" }, { status: 400 });
  const ticket = await prisma.$transaction(async (tx) => {
    const updated = await tx.supportTicket.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status, assigneeId: session.user.id }, select: { id: true, customerId: true, ticketNumber: true, status: true } });
    if (parsed.data.reply) await tx.supportMessage.create({ data: { ticketId: updated.id, authorId: session.user.id, body: parsed.data.reply } });
    return updated;
  });
  if (parsed.data.reply) await createNotification({ userId: ticket.customerId, title: "Support replied", body: `The store replied to ticket ${ticket.ticketNumber}.`, type: "system" });
  return NextResponse.json({ ticket });
}
