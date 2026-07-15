"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StaffReportEntry {
  id: string;
  orderNumber: string;
  customerName: string;
  acknowledgedByName: string;
  deliveryPartnerName: string;
  status: string;
  createdAt: string;
}

/**
 * Staff-Wise Order Report Page
 * Displays a tabular report showing which staff member acknowledged each order
 * and which delivery partner delivered it, with client-side date range filtering.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export default function StaffOrderReportPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<StaffReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchReport(start?: string, end?: string) {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/admin/reports/staff";
      if (start && end) {
        url += `?startDate=${start}&endDate=${end}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch report");
      }
      const data = await res.json();
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  }

  function handleFilter() {
    if (startDate && endDate) {
      fetchReport(startDate, endDate);
    } else if (!startDate && !endDate) {
      fetchReport();
    }
  }

  function handleClearFilter() {
    setStartDate("");
    setEndDate("");
    fetchReport();
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "CANCELLED":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "OUT_FOR_DELIVERY":
      case "ARRIVING":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "PACKING":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      case "READY_FOR_DELIVERY":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "ORDER_RECEIVED":
      case "ACCEPTED":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  }

  function formatStatus(status: string): string {
    return status
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="grid gap-5">
      {/* Header */}
      <section className="rounded-xl bg-[linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.12))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">
          Staff report
        </p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">
          Staff-Wise Order Report
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track which staff member acknowledged and which delivery partner
          delivered each order.
        </p>
      </section>

      {/* Date Range Filter */}
      <section className="rounded-xl border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10">
        <h2 className="text-sm font-black uppercase text-muted-foreground">
          Filter by Date Range
        </h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="startDate"
              className="block text-xs font-bold text-muted-foreground"
            >
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-xs font-bold text-muted-foreground"
            >
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={handleFilter}
            disabled={(!startDate && !!endDate) || (!!startDate && !endDate)}
            className="inline-flex h-10 items-center rounded-2xl bg-primary px-5 text-sm font-black text-white disabled:opacity-50"
          >
            Apply Filter
          </button>
          {(startDate || endDate) && (
            <button
              onClick={handleClearFilter}
              className="inline-flex h-10 items-center rounded-2xl border border-border px-5 text-sm font-black"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Report Table */}
      <section className="rounded-xl border border-white/70 bg-card/95 shadow-soft dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <p className="font-bold text-muted-foreground">Loading report...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="font-bold text-red-600">{error}</p>
          </div>
        ) : report.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="font-bold text-muted-foreground">
              No orders found for the selected date range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-black text-xs uppercase text-muted-foreground">
                    Order #
                  </th>
                  <th className="px-4 py-3 text-left font-black text-xs uppercase text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-black text-xs uppercase text-muted-foreground">
                    Acknowledged By
                  </th>
                  <th className="px-4 py-3 text-left font-black text-xs uppercase text-muted-foreground">
                    Delivery Partner
                  </th>
                  <th className="px-4 py-3 text-left font-black text-xs uppercase text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-black text-xs uppercase text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {report.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold">
                      #{entry.orderNumber}
                    </td>
                    <td className="px-4 py-3">{entry.customerName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          entry.acknowledgedByName === "Unassigned"
                            ? "text-muted-foreground italic"
                            : ""
                        }
                      >
                        {entry.acknowledgedByName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          entry.deliveryPartnerName === "Unassigned"
                            ? "text-muted-foreground italic"
                            : ""
                        }
                      >
                        {entry.deliveryPartnerName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusBadgeClass(entry.status)}`}
                      >
                        {formatStatus(entry.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Summary */}
      {!loading && !error && report.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {report.length} order{report.length !== 1 ? "s" : ""}
          {startDate && endDate && (
            <span>
              {" "}from {new Date(startDate).toLocaleDateString("en-IN")} to{" "}
              {new Date(endDate).toLocaleDateString("en-IN")}
            </span>
          )}
        </p>
      )}

      <Link
        href="/admin/reports"
        className="inline-flex h-11 w-fit items-center rounded-2xl border border-border px-5 text-sm font-black"
      >
        &larr; Back to Reports
      </Link>
    </main>
  );
}
