"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown, Trophy, Gift, ShoppingBag, Download } from "lucide-react";
import { Input } from "@/components/ui/input";

type RewardEntry = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  lifetimeEarned: number;
  deliveredOrders: number;
  joinedAt: string;
  updatedAt: string;
};

type SortField = "balance" | "lifetimeEarned" | "deliveredOrders" | "name" | "joinedAt";
type SortDirection = "asc" | "desc";

export function RewardsTableClient({ rewards }: { rewards: RewardEntry[] }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("balance");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return rewards;
    return rewards.filter(
      (entry) =>
        entry.name.toLowerCase().includes(query) ||
        entry.email.toLowerCase().includes(query) ||
        entry.phone.includes(query)
    );
  }, [rewards, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "balance":
          comparison = a.balance - b.balance;
          break;
        case "lifetimeEarned":
          comparison = a.lifetimeEarned - b.lifetimeEarned;
          break;
        case "deliveredOrders":
          comparison = a.deliveredOrders - b.deliveredOrders;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "joinedAt":
          comparison = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
          break;
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [filtered, sortField, sortDirection]);

  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(0);
  }

  function exportCsv() {
    const headers = ["Name", "Email", "Phone", "Balance", "Lifetime Earned", "Orders", "Joined"];
    const rows = sorted.map((r) => [
      r.name,
      r.email,
      r.phone,
      r.balance,
      r.lifetimeEarned,
      r.deliveredOrders,
      new Date(r.joinedAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rewards-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-5">
      {/* Search + Actions bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name, email, or phone..."
            className="h-11 rounded-xl pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">
            {sorted.length} customer{sorted.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={exportCsv}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-bold text-muted-foreground">
                <SortButton label="Customer" field="name" current={sortField} direction={sortDirection} onToggle={toggleSort} />
              </th>
              <th className="px-4 py-3 text-left font-bold text-muted-foreground hidden md:table-cell">Contact</th>
              <th className="px-4 py-3 text-right font-bold text-muted-foreground">
                <SortButton label="Balance" field="balance" current={sortField} direction={sortDirection} onToggle={toggleSort} />
              </th>
              <th className="px-4 py-3 text-right font-bold text-muted-foreground hidden sm:table-cell">
                <SortButton label="Lifetime" field="lifetimeEarned" current={sortField} direction={sortDirection} onToggle={toggleSort} />
              </th>
              <th className="px-4 py-3 text-right font-bold text-muted-foreground hidden lg:table-cell">
                <SortButton label="Orders" field="deliveredOrders" current={sortField} direction={sortDirection} onToggle={toggleSort} />
              </th>
              <th className="px-4 py-3 text-right font-bold text-muted-foreground hidden xl:table-cell">
                <SortButton label="Joined" field="joinedAt" current={sortField} direction={sortDirection} onToggle={toggleSort} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Trophy className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-3 font-bold text-muted-foreground">
                    {search ? "No customers match your search" : "No loyalty accounts yet"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Points are earned automatically after delivered orders.
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-xs font-black text-primary">
                          {entry.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 dark:text-white truncate">{entry.name}</p>
                        <p className="text-xs text-muted-foreground md:hidden truncate">
                          {entry.phone !== "—" ? entry.phone : entry.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-[180px]">{entry.email}</p>
                    <p className="text-xs text-muted-foreground">{entry.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 font-black text-primary">
                      <Gift className="h-3 w-3" />
                      {entry.balance}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="font-semibold text-neutral-600 dark:text-neutral-400">
                      {entry.lifetimeEarned}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500">
                      <ShoppingBag className="h-3 w-3" />
                      {entry.deliveredOrders}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden xl:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-bold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortButton({
  label,
  field,
  current,
  direction,
  onToggle,
}: {
  label: string;
  field: SortField;
  current: SortField;
  direction: SortDirection;
  onToggle: (field: SortField) => void;
}) {
  const isActive = current === field;
  return (
    <button
      type="button"
      onClick={() => onToggle(field)}
      className={`inline-flex items-center gap-1 ${isActive ? "text-primary" : ""}`}
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${isActive ? "text-primary" : "text-muted-foreground/50"}`} />
      {isActive && (
        <span className="text-[10px]">{direction === "desc" ? "↓" : "↑"}</span>
      )}
    </button>
  );
}
