import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { CustomerRequestsClient } from "@/components/admin/customer-requests-client";

export default async function CustomerRequestsPage() {
  const result = await requirePermission("requests.view");
  if ("error" in result) redirect("/admin");

  // Aggregate: substitutions (edit logs needing approval), support tickets, returns
  const [pendingEdits, supportTickets, returnRequests] = await Promise.all([
    prisma.orderEditLog.findMany({
      where: { requiresCustomerApproval: true, customerDecision: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { order: { select: { orderNumber: true, customerName: true, phone: true } } },
    }),
    prisma.supportTicket.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER"] } },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 50,
      include: {
        customer: { select: { name: true, phone: true } },
        order: { select: { orderNumber: true } },
        assignee: { select: { name: true } },
      },
    }),
    prisma.returnRequest.findMany({
      where: { status: { in: ["REQUESTED", "UNDER_REVIEW", "APPROVED"] } },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: { order: { select: { orderNumber: true, customerName: true, phone: true } } },
    }),
  ]);

  const requests = [
    ...pendingEdits.map((e) => ({
      id: e.id,
      type: "substitution" as const,
      orderNumber: e.order.orderNumber,
      customer: e.order.customerName,
      phone: e.order.phone,
      subject: `${e.action}: ${(e.originalItem as any)?.name || "item"}`,
      status: "OPEN" as const,
      priority: "NORMAL" as const,
      assignee: null,
      createdAt: e.createdAt.toISOString(),
      orderId: e.orderId,
    })),
    ...supportTickets.map((t) => ({
      id: t.id,
      type: "support" as const,
      orderNumber: t.order?.orderNumber || null,
      customer: t.customer.name || "Unknown",
      phone: t.customer.phone || "",
      subject: t.subject,
      status: t.status as string,
      priority: t.priority as string,
      assignee: t.assignee?.name || null,
      createdAt: t.createdAt.toISOString(),
      orderId: t.orderId,
    })),
    ...returnRequests.map((r) => ({
      id: r.id,
      type: "return" as const,
      orderNumber: r.order.orderNumber,
      customer: r.order.customerName,
      phone: r.order.phone,
      subject: `Return: ${r.reason}`,
      status: r.status as string,
      priority: r.status === "REQUESTED" ? "HIGH" : "NORMAL",
      assignee: null,
      createdAt: r.createdAt.toISOString(),
      orderId: r.orderId,
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const counts = {
    open: requests.filter((r) => r.status === "OPEN" || r.status === "REQUESTED").length,
    urgent: requests.filter((r) => r.priority === "URGENT" || r.priority === "HIGH").length,
    waiting: requests.filter((r) => r.status === "WAITING_FOR_CUSTOMER" || r.status === "UNDER_REVIEW").length,
    resolved: 0,
  };

  return <CustomerRequestsClient requests={requests} counts={counts} />;
}
