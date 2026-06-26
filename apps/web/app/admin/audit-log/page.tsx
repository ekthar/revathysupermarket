import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isOwnerRole } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function AuditLogPage({
  searchParams
}: {
  searchParams: Promise<{ action?: string; actor?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const canView = isOwnerRole(session?.user?.role) || session?.user?.role === "MANAGER";

  if (!canView) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Audit log</h2>
        <p className="mt-2 text-sm text-muted-foreground">Owner or manager access is required.</p>
      </div>
    );
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      action: params.action ? { contains: params.action, mode: "insensitive" } : undefined,
      actor: params.actor ? { name: { contains: params.actor, mode: "insensitive" } } : undefined
    },
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  }).catch(() => []);

  return (
    <div>
      <div className="rounded-xl bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Security trail</p>
        <h2 className="mt-2 font-display text-4xl font-black leading-tight">Audit log</h2>
        <form className="mt-5 grid gap-3 sm:grid-cols-2">
          <input
            name="action"
            defaultValue={params.action ?? ""}
            placeholder="Filter by action"
            className="h-12 rounded-2xl border border-white/70 bg-white/90 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-slate-900"
          />
          <input
            name="actor"
            defaultValue={params.actor ?? ""}
            placeholder="Filter by staff member"
            className="h-12 rounded-2xl border border-white/70 bg-white/90 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-slate-900"
          />
        </form>
      </div>
      <div className="mt-5 grid gap-3">
        {logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">No audit events found.</div>
        ) : logs.map((log) => (
          <article key={log.id} className="rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black">{log.action}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {log.actor?.name ?? log.actor?.email ?? "System"} · {log.actorRole} · {log.targetType}:{log.targetId}
                </p>
              </div>
              <time className="text-xs font-bold text-muted-foreground">{log.createdAt.toLocaleString("en-IN")}</time>
            </div>
            {log.metadata ? (
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-muted p-3 text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
