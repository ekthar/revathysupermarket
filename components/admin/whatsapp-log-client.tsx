"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";

type WhatsAppLogRow = {
  id: string;
  phone: string;
  orderId: string | null;
  template: string;
  status: string;
  error: string | null;
  createdAt: string;
};

export function WhatsAppLogClient({ logs }: { logs: WhatsAppLogRow[] }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  async function resend(id: string) {
    setLoading(id);
    const response = await fetch(`/api/admin/whatsapp-log/${id}/resend`, { method: "POST" });
    const data = await readApiResponse<{ error?: string; success?: boolean }>(response);
    setLoading(null);
    if (!response.ok || !data.success) {
      showToast(data.error ?? "Message could not be resent", "error");
      return;
    }
    showToast("WhatsApp message resent", "success");
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-card/95 shadow-soft dark:border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-muted text-xs font-black uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Error</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td className="px-4 py-8 text-center font-bold text-muted-foreground" colSpan={7}>No WhatsApp messages yet.</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="border-t border-border">
                <td className="px-4 py-3 font-bold">{log.phone}</td>
                <td className="px-4 py-3">{log.template}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{log.status}</span>
                </td>
                <td className="px-4 py-3">{log.orderId ?? "-"}</td>
                <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                <td className="max-w-[220px] truncate px-4 py-3 text-red-600">{log.error ?? "-"}</td>
                <td className="px-4 py-3">
                  <Button type="button" size="sm" variant="outline" onClick={() => resend(log.id)} disabled={!log.orderId || loading === log.id}>
                    <RefreshCw className="h-4 w-4" />
                    Resend
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
