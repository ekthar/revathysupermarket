"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useToast } from "@/components/toast-provider";

type Ticket = { id: string; ticketNumber: string; subject: string; status: string; priority: string; createdAt: string; updatedAt: string; customer: { name: string | null; phone: string | null }; order?: { id: string; orderNumber: string } | null; messages: Array<{ id: string; body: string; createdAt: string; author?: { name: string | null; role: string } }> };

export function SupportInboxClient({ initialTickets }: { initialTickets: Ticket[] }) {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState(initialTickets);
  const [filter, setFilter] = useState("ACTIVE");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const visible = useMemo(() => tickets.filter((ticket) => filter === "ALL" || (filter === "ACTIVE" ? !["RESOLVED", "CLOSED"].includes(ticket.status) : ticket.status === filter)), [tickets, filter]);

  async function update(ticket: Ticket, status: string) {
    setLoading(ticket.id);
    const response = await fetch("/api/admin/support", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ticket.id, status, reply: replies[ticket.id]?.trim() || undefined }) });
    const data = await response.json().catch(() => ({})); setLoading(null);
    if (!response.ok) return showToast(data.error ?? "Ticket update failed", "error");
    const reply = replies[ticket.id]?.trim();
    setTickets((current) => current.map((entry) => entry.id === ticket.id ? { ...entry, status, messages: reply ? [...entry.messages, { id: crypto.randomUUID(), body: reply, createdAt: new Date().toISOString(), author: { name: "Store team", role: "STAFF" } }] : entry.messages } : entry));
    setReplies((current) => ({ ...current, [ticket.id]: "" })); showToast("Support ticket updated", "success");
  }

  return <div className="space-y-4"><div className="flex gap-2 overflow-x-auto">{["ACTIVE", "OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED", "ALL"].map((status) => <button key={status} onClick={() => setFilter(status)} className={`h-10 whitespace-nowrap rounded-xl px-3 text-xs font-black ${filter === status ? "bg-primary text-white" : "border border-border bg-background"}`}>{status.replaceAll("_", " ")}</button>)}</div>{visible.length === 0 ? <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Support inbox is clear.</p> : visible.map((ticket) => <article key={ticket.id} className="rounded-3xl border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-primary">{ticket.ticketNumber} · {ticket.priority}</p><h2 className="mt-1 font-display text-xl font-black">{ticket.subject}</h2><p className="text-sm text-muted-foreground">{ticket.customer.name || ticket.customer.phone || "Customer"}{ticket.order && <> · <Link href={`/admin/orders/${ticket.order.id}`} className="text-primary underline">#{ticket.order.orderNumber}</Link></>}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{ticket.status.replaceAll("_", " ")}</span></div><div className="mt-3 space-y-2 rounded-2xl bg-muted p-3">{ticket.messages.map((message) => <div key={message.id} className="rounded-xl bg-background p-2 text-sm"><div className="flex justify-between gap-3 text-caption text-muted-foreground"><span>{message.author?.name || (message.author?.role === "CUSTOMER" ? "Customer" : "Store team")}</span><time>{new Date(message.createdAt).toLocaleString("en-IN")}</time></div><p className="mt-1">{message.body}</p></div>)}</div><textarea value={replies[ticket.id] || ""} onChange={(event) => setReplies((current) => ({ ...current, [ticket.id]: event.target.value }))} placeholder="Reply to customer" className="mt-3 min-h-20 w-full rounded-2xl border border-border bg-background p-3 text-sm"/><div className="mt-2 flex flex-wrap gap-2"><button disabled={loading === ticket.id} onClick={() => update(ticket, "IN_PROGRESS")} className="h-10 rounded-xl bg-primary px-3 text-xs font-black text-white">Reply / In progress</button><button disabled={loading === ticket.id} onClick={() => update(ticket, "WAITING_FOR_CUSTOMER")} className="h-10 rounded-xl bg-amber-100 px-3 text-xs font-black text-amber-800">Waiting</button><button disabled={loading === ticket.id} onClick={() => update(ticket, "RESOLVED")} className="h-10 rounded-xl bg-emerald-100 px-3 text-xs font-black text-emerald-700">Resolve</button>{["RESOLVED", "CLOSED"].includes(ticket.status) && <button disabled={loading === ticket.id} onClick={() => update(ticket, "OPEN")} className="h-10 rounded-xl border border-border px-3 text-xs font-black">Reopen</button>}<button disabled={loading === ticket.id} onClick={() => update(ticket, "CLOSED")} className="h-10 rounded-xl bg-muted px-3 text-xs font-black text-foreground">Close</button></div></article>)}</div>;
}
