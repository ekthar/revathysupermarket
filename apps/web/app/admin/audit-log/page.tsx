import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isOwnerRole } from "@/lib/authz";

export const dynamic = "force-dynamic";

/* ─── Action Badge ─── */
function ActionBadge({ action }: { action: string }) {
  const lower = action.toLowerCase();
  let color = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  if (lower.includes("created") || lower.includes("imported")) {
    color = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  } else if (
    lower.includes("updated") ||
    lower.includes("changed") ||
    lower.includes("edited")
  ) {
    color = "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  } else if (
    lower.includes("deleted") ||
    lower.includes("deactivated") ||
    lower.includes("locked")
  ) {
    color = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  }

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${color}`}
    >
      {action.replace(/_/g, " ")}
    </span>
  );
}

/* ─── Diff View ─── */
type DiffLine = {
  type: "add" | "remove" | "context";
  content: string;
};

function buildDiffLines(metadata: Record<string, unknown>): DiffLine[] {
  const lines: DiffLine[] = [];

  if (
    metadata &&
    typeof metadata === "object" &&
    "before" in metadata &&
    "after" in metadata &&
    typeof metadata.before === "object" &&
    typeof metadata.after === "object" &&
    metadata.before !== null &&
    metadata.after !== null
  ) {
    const before = metadata.before as Record<string, unknown>;
    const after = metadata.after as Record<string, unknown>;
    const allKeys = Array.from(
      new Set([...Object.keys(before), ...Object.keys(after)])
    );

    for (const key of allKeys) {
      const hadBefore = key in before;
      const hadAfter = key in after;

      if (hadBefore && hadAfter) {
        const oldVal = JSON.stringify(before[key]);
        const newVal = JSON.stringify(after[key]);
        if (oldVal === newVal) {
          lines.push({ type: "context", content: `  ${key}: ${oldVal}` });
        } else {
          lines.push({ type: "remove", content: `- ${key}: ${oldVal}` });
          lines.push({ type: "add", content: `+ ${key}: ${newVal}` });
        }
      } else if (hadBefore && !hadAfter) {
        lines.push({
          type: "remove",
          content: `- ${key}: ${JSON.stringify(before[key])}`
        });
      } else {
        lines.push({
          type: "add",
          content: `+ ${key}: ${JSON.stringify(after[key])}`
        });
      }
    }
  } else {
    // No before/after - render all fields as additions (creation/action log)
    const entries = Object.entries(metadata);
    for (const [key, value] of entries) {
      lines.push({ type: "add", content: `+ ${key}: ${JSON.stringify(value)}` });
    }
  }

  return lines;
}

function DiffView({ metadata }: { metadata: Record<string, unknown> }) {
  const lines = buildDiffLines(metadata);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 font-mono text-xs">
      <div className="overflow-x-auto">
        {lines.map((line, i) => {
          let bgClass = "";
          let textClass = "text-slate-400";

          if (line.type === "add") {
            bgClass = "bg-emerald-950/60";
            textClass = "text-emerald-300";
          } else if (line.type === "remove") {
            bgClass = "bg-red-950/60";
            textClass = "text-red-300";
          }

          return (
            <div
              key={i}
              className={`flex ${bgClass}`}
            >
              <span className="w-8 shrink-0 select-none border-r border-slate-700/50 py-0.5 text-right text-slate-600 pr-2">
                {i + 1}
              </span>
              <span className={`py-0.5 pl-3 pr-4 whitespace-pre ${textClass}`}>
                {line.content}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default async function AuditLogPage({
  searchParams
}: {
  searchParams: Promise<{ action?: string; actor?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const canView =
    isOwnerRole(session?.user?.role) || session?.user?.role === "MANAGER";

  if (!canView) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Audit log</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Owner or manager access is required.
        </p>
      </div>
    );
  }

  const logs = await prisma.auditLog
    .findMany({
      where: {
        action: params.action
          ? { contains: params.action, mode: "insensitive" }
          : undefined,
        actor: params.actor
          ? { name: { contains: params.actor, mode: "insensitive" } }
          : undefined
      },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    })
    .catch(() => []);

  return (
    <div>
      <div className="rounded-xl bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">
          Security trail
        </p>
        <h2 className="mt-2 font-display text-4xl font-black leading-tight">
          Audit log
        </h2>
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
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            No audit events found.
          </div>
        ) : (
          logs.map((log) => (
            <article
              key={log.id}
              className="rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <ActionBadge action={log.action} />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {log.actor?.name ?? log.actor?.email ?? "System"}
                    </span>
                    {" "}
                    <span className="opacity-60">({log.actorRole})</span>
                    {" · "}
                    <span className="font-medium">
                      {log.targetType}:{log.targetId}
                    </span>
                  </p>
                </div>
                <time className="rounded-lg bg-muted px-2 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {log.createdAt.toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </time>
              </div>
              {log.metadata ? (
                <DiffView
                  metadata={log.metadata as Record<string, unknown>}
                />
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
