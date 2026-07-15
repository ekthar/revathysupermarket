import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isOwnerRole } from "@/lib/authz";

export const dynamic = "force-dynamic";

/* ─── Action Badge ─── */
function ActionBadge({ action }: { action: string }) {
  const lower = action.toLowerCase();
  let color = "bg-muted text-muted-foreground";

  if (lower.includes("created") || lower.includes("imported")) {
    color = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  } else if (lower.includes("updated") || lower.includes("changed") || lower.includes("edited")) {
    color = "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  } else if (lower.includes("deleted") || lower.includes("deactivated") || lower.includes("locked")) {
    color = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  }

  return (
    <span className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${color}`}>
      {action.replace(/_/g, " ")}
    </span>
  );
}

/* ─── Time helpers ─── */
function formatTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function getDateString(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
}

/* ─── Main Page ─── */
export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; actor?: string; date?: string }>;
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

  // Date filtering - default to today
  const today = new Date();
  const selectedDate = params.date || getDateString(today);
  const startOfDay = new Date(`${selectedDate}T00:00:00+05:30`);
  const endOfDay = new Date(`${selectedDate}T23:59:59+05:30`);

  // Quick date navigation
  const prevDate = new Date(startOfDay);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(startOfDay);
  nextDate.setDate(nextDate.getDate() + 1);
  const isToday = selectedDate === getDateString(today);

  const logs = await prisma.auditLog
    .findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        action: params.action ? { contains: params.action, mode: "insensitive" } : undefined,
        actor: params.actor ? { name: { contains: params.actor, mode: "insensitive" } } : undefined,
      },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    })
    .catch(() => []);

  return (
    <div>
      <div className="rounded-xl bg-card border border-border p-5 sm:p-7">
        <h2 className="font-display text-2xl font-black">Audit Log</h2>
        <p className="mt-1 text-sm text-muted-foreground">Daily activity log — simple table view</p>

        {/* Date navigation */}
        <div className="mt-4 flex items-center gap-3">
          <a
            href={`/admin/audit-log?date=${getDateString(prevDate)}${params.action ? `&action=${params.action}` : ""}${params.actor ? `&actor=${params.actor}` : ""}`}
            className="h-9 rounded-lg border border-border px-3 flex items-center text-xs font-bold text-muted-foreground hover:bg-muted"
          >
            ← Prev Day
          </a>
          <span className="text-sm font-black text-foreground">{formatDate(startOfDay)}</span>
          {!isToday && (
            <a
              href={`/admin/audit-log?date=${getDateString(nextDate)}${params.action ? `&action=${params.action}` : ""}${params.actor ? `&actor=${params.actor}` : ""}`}
              className="h-9 rounded-lg border border-border px-3 flex items-center text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              Next Day →
            </a>
          )}
          {!isToday && (
            <a
              href="/admin/audit-log"
              className="h-9 rounded-lg bg-primary/10 px-3 flex items-center text-xs font-bold text-primary hover:bg-primary/20"
            >
              Today
            </a>
          )}
        </div>

        {/* Filters */}
        <form className="mt-4 flex gap-3 flex-wrap">
          <input type="hidden" name="date" value={selectedDate} />
          <input
            name="action"
            defaultValue={params.action ?? ""}
            placeholder="Filter by action"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary w-48"
          />
          <input
            name="actor"
            defaultValue={params.actor ?? ""}
            placeholder="Filter by staff"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary w-48"
          />
          <button type="submit" className="h-9 rounded-lg bg-primary px-4 text-xs font-bold text-white">
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <p className="text-sm font-bold text-foreground">
            {logs.length} {logs.length === 1 ? "event" : "events"}
          </p>
          <p className="text-xs text-muted-foreground">{formatDate(startOfDay)}</p>
        </div>

        {logs.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No audit events found for this day.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-muted-foreground">Time</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-muted-foreground">Staff</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-muted-foreground">Action</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-muted-foreground">Target</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const metadata = log.metadata as Record<string, unknown> | null;
                  const details = metadata
                    ? Object.entries(metadata)
                        .filter(([k]) => k !== "before" && k !== "after")
                        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                        .join(", ")
                        .slice(0, 100)
                    : "";

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {formatTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-foreground whitespace-nowrap">
                        {log.actor?.name ?? log.actor?.email ?? "System"}
                      </td>
                      <td className="px-4 py-2.5">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {log.targetType}:{log.targetId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
                        {details || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
