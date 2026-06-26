import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { SupportInboxClient } from "@/components/admin/support-inbox-client";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const permission = await requirePermission("requests.view");
  if ("error" in permission) redirect("/admin");
  const tickets = await prisma.supportTicket.findMany({ include: { customer: { select: { name: true, phone: true } }, order: { select: { id: true, orderNumber: true } }, messages: { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: "asc" } } }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }], take: 100 });
  return <div><h1 className="font-display text-3xl font-black">Support inbox</h1><p className="mt-1 text-sm text-muted-foreground">Reply, wait, resolve, reopen or close customer conversations.</p><div className="mt-5"><SupportInboxClient initialTickets={tickets.map((ticket) => ({ ...ticket, createdAt: ticket.createdAt.toISOString(), updatedAt: ticket.updatedAt.toISOString(), messages: ticket.messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() })) }))} /></div></div>;
}
