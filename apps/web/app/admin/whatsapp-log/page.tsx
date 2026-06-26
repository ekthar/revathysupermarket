import { prisma } from "@/lib/prisma";
import { WhatsAppLogClient } from "@/components/admin/whatsapp-log-client";

export const dynamic = "force-dynamic";

export default async function AdminWhatsAppLogPage({
  searchParams
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const logs = await prisma.whatsAppLog.findMany({
    where: order ? { orderId: order } : {},
    orderBy: { createdAt: "desc" },
    take: 100
  }).catch(() => []);

  return (
    <main className="grid gap-5">
      <section className="rounded-xl bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">WhatsApp Business</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">Message log</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track sent, delivered, read, and failed template messages.</p>
      </section>
      <WhatsAppLogClient logs={logs.map((log) => ({
        id: log.id,
        phone: log.phone,
        orderId: log.orderId,
        template: log.template,
        status: log.status,
        error: log.error,
        createdAt: log.createdAt.toISOString()
      }))} />
    </main>
  );
}
