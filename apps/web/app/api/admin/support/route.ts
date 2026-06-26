import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { createNotification } from "@/lib/notifications";

const schema = z.object({ id: z.string(), status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"]), reply: z.string().trim().max(2000).optional() });

export async function GET() {
  const permission = await requirePermission("requests.view");
  if ("error" in permission) return permission.error;
  const tickets = await prisma.supportTicket.findMany({ include: { customer: { select: { name: true, phone: true } }, order: { select: { id: true, orderNumber: true } }, messages: { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: "asc" } } }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }], take: 100 });
  return NextResponse.json({ tickets });
}

export async function PATCH(request: Request) {
  const permission = await requirePermission("requests.manage");
  if ("error" in permission) return permission.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid support update.", code: "INVALID_SUPPORT_UPDATE" }, { status: 400 });
  const ticket = await prisma.$transaction(async (tx) => {
    const updated = await tx.supportTicket.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status, assigneeId: permission.ctx.userId }, select: { id: true, customerId: true, ticketNumber: true, status: true } });
    if (parsed.data.reply) await tx.supportMessage.create({ data: { ticketId: updated.id, authorId: permission.ctx.userId, body: parsed.data.reply } });
    return updated;
  });
  if (parsed.data.reply) await createNotification({ userId: ticket.customerId, title: "Support replied", body: `The store replied to ticket ${ticket.ticketNumber}.`, type: "system" });
  return NextResponse.json({ ticket });
}
