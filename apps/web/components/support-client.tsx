"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useToast } from "@/components/toast-provider";

type Ticket = { id: string; ticketNumber: string; subject: string; status: string; priority: string; updatedAt: string };

export function SupportClient({ initialTickets, whatsapp }: { initialTickets: Ticket[]; whatsapp: string }) {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState(initialTickets);
  const [subject, setSubject] = useState(""); const [message, setMessage] = useState(""); const [sending, setSending] = useState(false);
  async function createTicket(event: React.FormEvent) {
    event.preventDefault(); setSending(true);
    const response = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, message, priority: "NORMAL" }) });
    const data = await response.json().catch(() => ({})); setSending(false);
    if (!response.ok) return showToast(data.error ?? "Support request failed", "error");
    setTickets((current) => [data.ticket, ...current]); setSubject(""); setMessage(""); showToast("Support ticket created", "success");
  }
  const whatsappUrl = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hello, I need help with my MSM Supermarket order.")}`;
  return <div className="space-y-4"><form onSubmit={createTicket} className="grid gap-3 rounded-3xl border border-border bg-card p-4"><h2 className="font-display text-xl font-black">How can we help?</h2><label className="text-sm font-bold">Subject<input required minLength={4} maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-3" /></label><label className="text-sm font-bold">Message<textarea required minLength={4} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 min-h-28 w-full rounded-2xl border border-border bg-background p-3" /></label><button disabled={sending} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-white disabled:opacity-50"><Send className="h-4 w-4" />{sending ? "Sending…" : "Create ticket"}</button><a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/30 text-sm font-black text-primary"><MessageCircle className="h-4 w-4" />Chat on WhatsApp</a></form><section className="rounded-3xl border border-border bg-card p-4"><h2 className="font-display text-xl font-black">Your tickets</h2><div className="mt-3 grid gap-2">{tickets.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No support tickets yet.</p> : tickets.map((ticket) => <article key={ticket.id} className="rounded-2xl bg-muted p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black">{ticket.subject}</p><p className="text-xs text-muted-foreground">{ticket.ticketNumber}</p></div><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-black text-primary">{ticket.status.replaceAll("_", " ")}</span></div></article>)}</div></section></div>;
}
