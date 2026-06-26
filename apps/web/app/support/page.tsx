import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPublicStoreSettings } from "@/lib/store-settings";
import { SupportClient } from "@/components/support-client";

export const dynamic = "force-dynamic";
export default async function SupportPage() {
  const session = await auth(); if (!session?.user?.id) redirect("/login?callbackUrl=/support");
  const [tickets, settings] = await Promise.all([prisma.supportTicket.findMany({ where: { customerId: session.user.id }, orderBy: { updatedAt: "desc" } }), getPublicStoreSettings()]);
  return <main className="mx-auto max-w-lg px-4 py-5"><h1 className="font-display text-3xl font-black">Help & support</h1><p className="mt-1 text-sm text-muted-foreground">Get help from the store team with a clear history.</p><div className="mt-5"><SupportClient initialTickets={tickets.map((ticket) => ({ ...ticket, updatedAt: ticket.updatedAt.toISOString() }))} whatsapp={settings.whatsapp} /></div></main>;
}
