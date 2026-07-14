"use client";

import { useState } from "react";
import { Bell, CheckCircle2, Clock, Megaphone, Send, ShoppingBag, Sparkles, Users, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/toast-provider";
import { readApiResponse } from "@/lib/client-api";

// Pre-built notification templates
const templates = [
  {
    id: "flash-sale",
    name: "Flash Sale",
    icon: Zap,
    color: "bg-orange-50 text-orange-600 dark:bg-orange-950/30",
    title: "Flash Sale! Up to 30% OFF",
    body: "Limited time offer on fresh groceries. Order now before stock runs out!",
    url: "/offers"
  },
  {
    id: "new-arrivals",
    name: "New Arrivals",
    icon: Sparkles,
    color: "bg-purple-50 text-purple-600 dark:bg-purple-950/30",
    title: "Fresh Arrivals Just In!",
    body: "New seasonal fruits and vegetables added. Check out what's fresh today.",
    url: "/products"
  },
  {
    id: "free-delivery",
    name: "Free Delivery",
    icon: ShoppingBag,
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30",
    title: "Free Delivery Today!",
    body: "No delivery charges on all orders today. Stock up on your essentials!",
    url: "/products"
  },
  {
    id: "weekend-offer",
    name: "Weekend Offer",
    icon: Megaphone,
    color: "bg-pink-50 text-pink-600 dark:bg-pink-950/30",
    title: "Weekend Special Offer",
    body: "Exclusive weekend discounts on dairy, snacks & beverages. Don't miss out!",
    url: "/offers"
  },
  {
    id: "reorder-reminder",
    name: "Reorder Reminder",
    icon: Clock,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30",
    title: "Time to Restock?",
    body: "It's been a while since your last order. Your favorites are waiting!",
    url: "/products"
  },
  {
    id: "custom",
    name: "Custom Message",
    icon: Bell,
    color: "bg-muted text-muted-foreground",
    title: "",
    body: "",
    url: "/"
  }
];

interface BroadcastHistory {
  id: string;
  title: string;
  body: string;
  audience: string;
  sent: number;
  failed: number;
  total: number;
  createdAt: string;
}

export function PushNotificationSender({
  totalSubscribers,
  customerSubscribers,
  history
}: {
  totalSubscribers: number;
  customerSubscribers: number;
  history: BroadcastHistory[];
}) {
  const { showToast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [audience, setAudience] = useState<"all" | "customers" | "staff">("customers");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);

  function selectTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setSelectedTemplate(templateId);
    setTitle(template.title);
    setBody(template.body);
    setUrl(template.url);
  }

  async function sendNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast("Title and message are required", "error");
      return;
    }

    setSending(true);
    setResult(null);

    const res = await fetch("/api/admin/push-broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, url, audience })
    });
    const data = await readApiResponse<{ sent?: number; total?: number; error?: string }>(res);
    setSending(false);

    if (!res.ok) {
      showToast(data.error || "Failed to send notification", "error");
      return;
    }

    setResult({ sent: data.sent || 0, total: data.total || 0 });
    showToast(`Sent to ${data.sent} of ${data.total} subscribers`, "success");
  }

  return (
    <div className="space-y-5">
      {/* Subscriber stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border p-4">
          <Users className="h-5 w-5 text-blue-600" />
          <p className="text-heading font-bold text-foreground mt-2">{totalSubscribers}</p>
          <p className="text-caption text-muted-foreground">Total subscribers</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <p className="text-heading font-bold text-foreground mt-2">{customerSubscribers}</p>
          <p className="text-caption text-muted-foreground">Customers</p>
        </div>
      </div>

      {/* Templates */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <p className="text-caption font-semibold text-muted-foreground mb-3">Choose a template or write custom</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {templates.map((template) => {
            const Icon = template.icon;
            const isSelected = selectedTemplate === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => selectTemplate(template.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all press ${
                  isSelected
                    ? "bg-primary/10 border-2 border-primary dark:bg-primary/20"
                    : "bg-muted border-2 border-transparent hover:border-border"
                }`}
              >
                <div className={`h-8 w-8 rounded-lg ${template.color} flex items-center justify-center`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-micro font-semibold text-muted-foreground">{template.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compose form */}
      <form onSubmit={sendNotification} className="rounded-2xl bg-card border border-border p-5 space-y-4">
        <p className="text-body font-bold text-foreground">Compose Notification</p>

        <div>
          <label className="text-caption font-semibold text-muted-foreground mb-1 block">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            maxLength={100}
            required
            className="w-full h-10 rounded-xl border border-border bg-muted px-3 text-body font-medium outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-caption font-semibold text-muted-foreground mb-1 block">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your notification message..."
            maxLength={300}
            rows={3}
            required
            className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-body outline-none resize-none focus:border-primary"
          />
          <p className="text-micro text-muted-foreground mt-1">{body.length}/300 characters</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-caption font-semibold text-muted-foreground mb-1 block">Link (URL)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/"
              className="w-full h-10 rounded-xl border border-border bg-muted px-3 text-body outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-caption font-semibold text-muted-foreground mb-1 block">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-border bg-muted px-3 text-body font-semibold outline-none"
            >
              <option value="all">All Subscribers ({totalSubscribers})</option>
              <option value="customers">Customers Only ({customerSubscribers})</option>
              <option value="staff">Staff Only ({totalSubscribers - customerSubscribers})</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        {title && (
          <div className="rounded-xl bg-muted p-3 border border-border">
            <p className="text-micro font-semibold text-muted-foreground uppercase mb-2">Preview</p>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-body font-bold text-foreground">{title}</p>
                <p className="text-caption text-muted-foreground mt-0.5">{body}</p>
              </div>
            </div>
          </div>
        )}

        {/* Send button */}
        <button
          type="submit"
          disabled={sending || !title || !body}
          className="w-full h-12 rounded-xl bg-primary text-white text-body font-bold flex items-center justify-center gap-2 press disabled:opacity-50 shadow-sm"
        >
          {sending ? (
            <span>Sending...</span>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send to {audience === "all" ? totalSubscribers : audience === "customers" ? customerSubscribers : totalSubscribers - customerSubscribers} subscriber{totalSubscribers !== 1 ? "s" : ""}
            </>
          )}
        </button>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 p-3 flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-caption font-semibold text-emerald-700 dark:text-emerald-300">
                Successfully sent to {result.sent} of {result.total} subscribers
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Broadcast History */}
      {history.length > 0 && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-caption font-semibold text-muted-foreground uppercase">Recent Broadcasts</p>
          <div className="divide-y divide-border">
            {history.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold text-foreground truncate flex-1">{item.title}</p>
                  <span className="text-micro text-muted-foreground shrink-0 ml-2">
                    {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </span>
                </div>
                <p className="text-caption text-muted-foreground mt-0.5 truncate">{item.body}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-micro font-medium text-emerald-600">{item.sent} sent</span>
                  {item.failed > 0 && <span className="text-micro font-medium text-red-500">{item.failed} failed</span>}
                  <span className="text-micro text-muted-foreground">{item.audience}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
