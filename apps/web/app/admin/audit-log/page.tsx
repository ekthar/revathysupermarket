import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isOwnerRole } from "@/lib/authz";
import { GitCommitHorizontal, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

/* ─── Action Badge ─── */
function ActionBadge({ action }: { action: string }) {
  const lower = action.toLowerCase();
  let color = "bg-muted text-muted-foreground";

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
      className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${color}`}
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

/**
 * Builds unified-diff-style lines from a before/after metadata payload.
 *
 * Note: for a changed field we push the "+" (new value) line BEFORE the "-"
 * (old value) line, so additions render above removals — this is the
 * opposite of GitHub's own convention (which shows "-" above "+"), but it's
 * what was explicitly requested here.
 */
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
          // Addition on top, then removal — per explicit request.
          lines.push({ type: "add", content: `+ ${key}: ${newVal}` });
          lines.push({ type: "remove", content: `- ${key}: ${oldVal}` });
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

/** GitHub-style file diff block: a filename/target header bar, then +/- lines. */
function DiffView({
  metadata,
  target
}: {
  metadata: Record<string, unknown>;
  target: string;
}) {
  const lines = buildDiffLines(metadata);
  if (lines.length === 0) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-700/60 bg-slate-900 font-mono text-xs shadow-inner">
      {/* Diff header bar — like GitHub's file-name bar on a commit diff */}
      <div className="flex items-center justify-between border-b border-slate-700/60 bg-slate-800/80 px-3 py-1.5">
        <span className="truncate text-[12px] font-semibold text-slate-300">{target}</span>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          diff
        </span>
      </div>
      <div className="overflow-x-auto">
        {lines.map((line, i) => {
          let bgClass = "";
          let textClass = "text-slate-400";
          let gutter = " ";

          if (line.type === "add") {
            bgClass = "bg-emerald-950/60";
            textClass = "text-emerald-300";
            gutter = "+";
          } else if (line.type === "remove") {
            bgClass = "bg-red-950/60";
            textClass = "text-red-300";
            gutter = "-";
          }

          return (
            <div key={i} className={`flex ${bgClass}`}>
              <span className="w-5 shrink-0 select-none py-0.5 text-center font-bold text-slate-600">
                {gutter}
              </span>
              <span className="w-8 shrink-0 select-none border-r border-slate-700/50 py-0.5 text-right text-slate-600 pr-2">
                {i + 1}
              </span>
              <span className={`py-0.5 pl-3 pr-4 whitespace-pre ${textClass}`}>
                {line.content.replace(/^[+-]\s?/, "")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Time helpers ─── */
function relativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const seconds = Math.round(diffMs / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function absoluteTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic-ish avatar background color from a name/email string. */
function avatarColor(seed: string): string {
  const palette = [
    "bg-violet-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500"
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

/* ─── Commit-style row ─── */
function AuditRow({
  actorName,
  actorRole,
  action,
  targetType,
  targetId,
  createdAt,
  metadata
}: {
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: Date;
  metadata: Record<string, unknown> | null;
}) {
  const readableAction = action.replace(/_/g, " ").toLowerCase();
  const headline = `${actorName} ${readableAction} ${targetType.toLowerCase()} ${targetId}`;

  return (
    <li className="group relative border-b border-border/70 px-4 py-4 last:border-b-0 sm:px-6">
      <div className="flex gap-3">
        {/* Avatar / initial circle */}
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${avatarColor(
            actorName
          )}`}
          aria-hidden
        >
          {initialsOf(actorName)}
        </div>

        <div className="min-w-0 flex-1">
          {/* Commit-message-style header line */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="min-w-0 flex-1 truncate font-mono text-[13px] font-semibold text-foreground sm:text-sm">
              <GitCommitHorizontal className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px text-muted-foreground" />
              {headline}
            </p>
            <ActionBadge action={action} />
          </div>

          {/* Comment-style block: who did this + other details */}
          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">{actorName}</span>{" "}
              <span className="opacity-70">({actorRole})</span>{" "}
              committed on{" "}
              <span className="font-medium text-foreground">
                {targetType}:{targetId}
              </span>{" "}
              ·{" "}
              <time dateTime={createdAt.toISOString()} title={absoluteTime(createdAt)}>
                {relativeTime(createdAt)}
              </time>{" "}
              <span className="opacity-60">({absoluteTime(createdAt)})</span>
            </p>
          </div>

          {metadata ? (
            <DiffView metadata={metadata} target={`${targetType}/${targetId}`} />
          ) : null}
        </div>
      </div>
    </li>
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
            className="h-12 rounded-2xl border border-border bg-card/90 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            name="actor"
            defaultValue={params.actor ?? ""}
            placeholder="Filter by staff member"
            className="h-12 rounded-2xl border border-border bg-card/90 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
          />
        </form>
      </div>

      {/* Full-width GitHub-style "commits" list */}
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-3 sm:px-6">
          <p className="text-sm font-bold text-foreground">
            {logs.length} {logs.length === 1 ? "event" : "events"}
          </p>
          <p className="text-xs text-muted-foreground">Most recent first</p>
        </div>
        {logs.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No audit events found.
          </div>
        ) : (
          <ul className="divide-y divide-border/0">
            {logs.map((log) => (
              <AuditRow
                key={log.id}
                actorName={log.actor?.name ?? log.actor?.email ?? "System"}
                actorRole={log.actorRole}
                action={log.action}
                targetType={log.targetType}
                targetId={log.targetId}
                createdAt={log.createdAt}
                metadata={log.metadata as Record<string, unknown> | null}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
